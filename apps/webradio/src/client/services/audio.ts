// Gapless dual-element audio player.
//
// Two <audio> elements are kept alive: `active` (audible) and `standby`
// (used to pre-buffer the next track). When the radio advances, if the next
// track was already preloaded into `standby` we swap the roles and start the
// already-buffered element immediately, crossfading from the outgoing one so
// there is no audible gap.

const CROSSFADE_MS = 300;

function createAudioElement(): HTMLAudioElement {
  const el = document.createElement('audio');
  el.autoplay = false;
  el.preload = 'auto';
  el.style.display = 'none';
  document.body.appendChild(el);

  // Prevent seeking to maintain radio sync.
  el.addEventListener('seeked', (event) => {
    event.preventDefault();
  });

  return el;
}

let active = createAudioElement();
active.id = 'audio-player';
let standby = createAudioElement();
standby.id = 'audio-player-standby';

// User-facing volume/mute state, decoupled from the raw element volume so we
// can freely ramp element volume during crossfades.
let userVolume = 1;
let userMuted = false;

// URL currently loaded into the standby element (null if none / consumed).
let preloadedUrl: string | null = null;

// Guard so overlapping crossfades don't fight over element volumes.
let crossfadeTimer: number | null = null;
let crossfadeRaf: number | null = null;

// Registered listeners, re-bound to whichever element is active after a swap.
type Listener = () => void;
const listeners: Record<string, Listener[]> = {
  play: [],
  pause: [],
  timeupdate: [],
  loadedmetadata: [],
  durationchange: [],
};

function bindListeners(el: HTMLAudioElement): void {
  for (const [type, cbs] of Object.entries(listeners)) {
    for (const cb of cbs) {
      el.addEventListener(type, cb);
    }
  }
}

function unbindListeners(el: HTMLAudioElement): void {
  for (const [type, cbs] of Object.entries(listeners)) {
    for (const cb of cbs) {
      el.removeEventListener(type, cb);
    }
  }
}

// Listeners are attached only to the active element so the progress bar /
// equalizer wiring in main.ts always reflects the audible track.
bindListeners(active);

// --- Optional Web Audio spectrum analysis --------------------------------
// The equalizer can react to the real audio signal, but the Web Audio API
// only yields data for a cross-origin source when that source sends CORS
// headers (the OVH S3 bucket must allow the site origin). We probe the first
// URL: if CORS is available we route the elements through an AnalyserNode;
// otherwise playback is left completely untouched and the equalizer falls back
// to a synthesized animation. Audio is never sacrificed for the visualization.
let audioCtx: AudioContext | null = null;
let analyserEnabled = false;
let corsProbed = false;
let freqData: Uint8Array | null = null;
const analyserNodes = new WeakMap<HTMLAudioElement, AnalyserNode>();
const sourceNodes = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
const corsLoaded = new WeakSet<HTMLAudioElement>();

function ensureContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

// Resume the AudioContext from a user gesture (browser autoplay policy).
export function resumeAnalyser(): void {
  const ctx = ensureContext();
  if (ctx && ctx.state !== 'running') {
    ctx.resume().catch(() => {});
  }
}

async function probeCors(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    controller.abort(); // headers are enough — don't download the body
    return res.type === 'cors' || res.ok;
  } catch {
    return false;
  }
}

function maybeEnableAnalysis(url: string): void {
  if (corsProbed) return;
  corsProbed = true;
  probeCors(url).then((ok) => {
    if (!ok) return; // keep plain playback + synthesized equalizer
    analyserEnabled = true;
    // Loads from now on are fetched with CORS so the analyser sees real data.
    active.crossOrigin = 'anonymous';
    standby.crossOrigin = 'anonymous';
  });
}

// Track which element's *current* media was fetched with CORS, so we only ever
// analyse a safe (untainted) element.
function markSrc(el: HTMLAudioElement): void {
  if (analyserEnabled) corsLoaded.add(el);
  else corsLoaded.delete(el);
}

// Route an element through the analyser once (permanent). Only when the
// context is actually running, so we never silence a suspended graph.
function attach(el: HTMLAudioElement): AnalyserNode | null {
  const existing = analyserNodes.get(el);
  if (existing) return existing;
  const ctx = ensureContext();
  if (!ctx || ctx.state !== 'running') {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return null;
  }
  try {
    const source = ctx.createMediaElementSource(el);
    const an = ctx.createAnalyser();
    an.fftSize = 1024; // 512 bins — enough resolution for log-spaced bands
    an.smoothingTimeConstant = 0.7; // a bit snappier so vocals/transients show
    source.connect(an);
    an.connect(ctx.destination);
    sourceNodes.set(el, source);
    analyserNodes.set(el, an);
    if (!freqData) freqData = new Uint8Array(an.frequencyBinCount);
    return an;
  } catch {
    return null;
  }
}

/**
 * Frequency levels (0..1) for `barCount` bars from the ACTIVE element, or null
 * when real analysis isn't available (no CORS, context not running, or the
 * current track wasn't CORS-loaded). Callers fall back gracefully.
 */
export function getFrequencyLevels(barCount: number): number[] | null {
  if (!analyserEnabled || !corsLoaded.has(active)) return null;
  const ctx = audioCtx;
  if (!ctx || ctx.state !== 'running') return null;
  const an = attach(active);
  if (!an || !freqData) return null;

  an.getByteFrequencyData(freqData);

  // FFT bins are LINEAR in frequency, but perception (and musical content) is
  // logarithmic — a linear split buries vocals/mids/highs under the bass. Map
  // each bar to a log-spaced band and tilt the gain up with frequency to undo
  // the natural spectral roll-off, so speech/singing move as much as the beat.
  const bins = freqData.length; // fftSize / 2
  const binHz = ctx.sampleRate / (bins * 2); // = sampleRate / fftSize
  const fMin = 40;
  const fMax = Math.min(16000, ctx.sampleRate / 2);
  const ratio = fMax / fMin;

  const out: number[] = new Array(barCount);
  let energy = 0;
  let prevEnd = 0;
  for (let i = 0; i < barCount; i++) {
    const fHi = fMin * Math.pow(ratio, (i + 1) / barCount);
    const end = Math.min(bins, Math.max(prevEnd + 1, Math.round(fHi / binHz)));
    const start = prevEnd < end ? prevEnd : end - 1;
    prevEnd = end;

    // Blend average + peak: peak keeps wide high bands lively.
    let sum = 0;
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = freqData[j] ?? 0;
      sum += v;
      if (v > peak) peak = v;
    }
    const count = end - start;
    const level = (sum / count) * 0.5 + peak * 0.5; // 0..255
    const tilt = 1 + 1.4 * (i / (barCount - 1)); // bass 1x → treble ~2.4x
    const val = Math.min(1, Math.pow(level / 255, 0.9) * tilt);
    out[i] = val;
    energy += val;
  }
  // Flat-zero means a tainted stream slipped through → let the synth take over.
  return energy > 0.001 ? out : null;
}

function targetVolume(): number {
  return userMuted ? 0 : userVolume;
}

function applyVolume(): void {
  // Keep both elements in sync with the user setting when no crossfade is
  // running. During a crossfade the ramp owns the volumes.
  if (crossfadeTimer !== null || crossfadeRaf !== null) {
    return;
  }
  active.volume = targetVolume();
  standby.volume = targetVolume();
}

function cancelCrossfade(): void {
  if (crossfadeTimer !== null) {
    clearTimeout(crossfadeTimer);
    crossfadeTimer = null;
  }
  if (crossfadeRaf !== null) {
    cancelAnimationFrame(crossfadeRaf);
    crossfadeRaf = null;
  }
}

// Swap active <-> standby roles, moving event listeners to the new active.
function swapElements(): void {
  unbindListeners(active);
  const previouslyActive = active;
  active = standby;
  standby = previouslyActive;
  bindListeners(active);
}

// Crossfade from `outgoing` to the (already active) incoming element.
function crossfade(outgoing: HTMLAudioElement): void {
  cancelCrossfade();

  const to = targetVolume();
  active.volume = 0;
  outgoing.volume = to;

  const start = performance.now();

  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / CROSSFADE_MS);
    active.volume = to * t;
    outgoing.volume = to * (1 - t);

    if (t < 1) {
      crossfadeRaf = requestAnimationFrame(step);
    } else {
      crossfadeRaf = null;
      crossfadeTimer = null;
      outgoing.pause();
      outgoing.currentTime = 0;
      outgoing.removeAttribute('src');
      outgoing.load();
      active.volume = targetVolume();
    }
  };

  crossfadeRaf = requestAnimationFrame(step);
}

export function play(): void {
  active.play().catch((error) => {
    console.log('Playback failed:', error);
  });
}

export function pause(): void {
  active.pause();
}

export function togglePlayPause(): void {
  if (active.paused) {
    console.log('Attempting to play...');
    play();
  } else {
    console.log('Attempting to pause...');
    pause();
  }
}

export function setSource(url: string): void {
  maybeEnableAnalysis(url);
  active.src = url;
  active.load();
  markSrc(active);
}

// Pre-buffer `url` into the standby element so a later switch is gapless.
export function preload(url: string): void {
  if (preloadedUrl === url && standby.src) {
    return;
  }
  maybeEnableAnalysis(url);
  preloadedUrl = url;
  standby.src = url;
  standby.volume = 0;
  standby.load();
  markSrc(standby);
}

// Switch to `url`. If it matches the preloaded standby, swap + crossfade for a
// gapless transition. Otherwise fall back to loading it on the active element.
export function playPreloadedOrSet(url: string): void {
  maybeEnableAnalysis(url);
  const wasPlaying = document.body.classList.contains('user-interacted') && !active.paused;

  if (preloadedUrl === url && standby.src) {
    const outgoing = active;
    swapElements();
    preloadedUrl = null;

    // The new active carries the pre-buffered next track; if it was CORS-loaded
    // route it through the analyser now (before playing) for a real spectrum.
    if (analyserEnabled && corsLoaded.has(active)) attach(active);

    // New active is the pre-buffered standby: start it immediately.
    active.currentTime = 0;
    if (wasPlaying) {
      active.play().catch((error) => {
        console.log('Playback failed:', error);
      });
      crossfade(outgoing);
    } else {
      cancelCrossfade();
      outgoing.pause();
      outgoing.currentTime = 0;
      outgoing.removeAttribute('src');
      outgoing.load();
      active.volume = targetVolume();
    }
  } else {
    // Cache miss / first load: plain source set on the active element.
    cancelCrossfade();
    setSource(url);
    active.volume = targetVolume();
  }
}

export function setCurrentTime(time: number): void {
  active.currentTime = time;
}

export function setVolume(volume: number): void {
  userVolume = Math.max(0, Math.min(1, volume));
  applyVolume();
}

export function getVolume(): number {
  return userVolume;
}

export function toggleMute(): void {
  userMuted = !userMuted;
  active.muted = userMuted;
  standby.muted = userMuted;
  applyVolume();
}

export function isMuted(): boolean {
  return userMuted;
}

export function getCurrentTime(): number {
  return active.currentTime;
}

export function getDuration(): number {
  return active.duration;
}

export function isPaused(): boolean {
  return active.paused;
}

export function hasSource(): boolean {
  return !!active.src;
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function register(type: string, cb: Listener): void {
  listeners[type]?.push(cb);
  active.addEventListener(type, cb);
}

export function onPlay(cb: () => void): void {
  register('play', cb);
}

export function onPause(cb: () => void): void {
  register('pause', cb);
}

export function onTimeUpdate(cb: () => void): void {
  register('timeupdate', cb);
}

export function onLoadedMetadata(cb: () => void): void {
  register('loadedmetadata', cb);
}

export function onDurationChange(cb: () => void): void {
  register('durationchange', cb);
}

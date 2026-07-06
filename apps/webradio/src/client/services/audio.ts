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
  active.src = url;
  active.load();
}

// Pre-buffer `url` into the standby element so a later switch is gapless.
export function preload(url: string): void {
  if (preloadedUrl === url && standby.src) {
    return;
  }
  preloadedUrl = url;
  standby.src = url;
  standby.volume = 0;
  standby.load();
}

// Switch to `url`. If it matches the preloaded standby, swap + crossfade for a
// gapless transition. Otherwise fall back to loading it on the active element.
export function playPreloadedOrSet(url: string): void {
  const wasPlaying = document.body.classList.contains('user-interacted') && !active.paused;

  if (preloadedUrl === url && standby.src) {
    const outgoing = active;
    swapElements();
    preloadedUrl = null;

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

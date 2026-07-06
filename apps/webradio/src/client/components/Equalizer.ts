import * as audioService from '../services/audio';

export interface EqualizerComponent {
  element: HTMLElement;
  setPlaying: (playing: boolean) => void;
}

const BAR_COUNT = 16;
const REST_LEVEL = 0.08; // idle bar height (fraction of full height)

// Synthesized, audio-agnostic levels used when we can't read the real signal
// (no CORS on the audio source). Overlapping sines give a lively, spectrum-like
// motion with more energy in the middle bars.
function synthLevels(count: number, tSec: number): number[] {
  const out: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.sin(tSec * 3.0 + i * 0.55);
    const b = Math.sin(tSec * 5.3 + i * 1.7);
    const center = 1 - Math.abs(i / (count - 1) - 0.5) * 1.4; // peak in the middle
    let v = 0.5 + 0.32 * a + 0.16 * b;
    v *= 0.55 + 0.45 * Math.max(0, center);
    out[i] = Math.min(1, Math.max(0.06, v));
  }
  return out;
}

export function createEqualizer(): EqualizerComponent {
  const el = document.createElement('div');
  el.className = 'equalizer';

  const bars: HTMLElement[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    el.appendChild(bar);
    bars.push(bar);
  }

  let playing = false;
  let rafId = 0;

  function paint(levels: number[]): void {
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      if (!bar) continue;
      const level = levels[i] ?? REST_LEVEL;
      // Map 0..1 onto 10%..100% so bars never fully disappear.
      bar.style.height = `${Math.round((0.1 + level * 0.9) * 100)}%`;
    }
  }

  function rest(): void {
    paint(new Array(bars.length).fill(REST_LEVEL));
  }

  function frame(): void {
    const real = audioService.getFrequencyLevels(BAR_COUNT);
    if (real) {
      el.classList.add('is-live');
      paint(real);
    } else {
      el.classList.remove('is-live');
      paint(synthLevels(BAR_COUNT, performance.now() / 1000));
    }
    rafId = requestAnimationFrame(frame);
  }

  rest();

  return {
    element: el,
    setPlaying(next: boolean) {
      if (next === playing) return;
      playing = next;
      if (next) {
        if (!rafId) rafId = requestAnimationFrame(frame);
      } else {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        el.classList.remove('is-live');
        rest();
      }
    },
  };
}

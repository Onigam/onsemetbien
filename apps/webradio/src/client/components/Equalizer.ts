import * as audioService from '../services/audio';

export interface EqualizerComponent {
  element: HTMLElement;
  setPlaying: (playing: boolean) => void;
}

const BAR_COUNT = 16;
const REST_LEVEL = 0.08; // idle bar height (fraction of full height)

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
      // No real spectrum available: keep the bars idle (no fake animation).
      el.classList.remove('is-live');
      rest();
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

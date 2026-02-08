export interface EqualizerComponent {
  element: HTMLElement;
  setPlaying: (playing: boolean) => void;
}

export function createEqualizer(): EqualizerComponent {
  const el = document.createElement('div');
  el.className = 'equalizer';

  for (let i = 0; i < 5; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    el.appendChild(bar);
  }

  return {
    element: el,
    setPlaying(playing: boolean) {
      if (playing) {
        el.classList.add('playing');
      } else {
        el.classList.remove('playing');
      }
    },
  };
}

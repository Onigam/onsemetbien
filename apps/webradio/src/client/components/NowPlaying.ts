export interface NowPlayingComponent {
  element: HTMLElement;
  update: (title: string) => void;
}

export function createNowPlaying(): NowPlayingComponent {
  const el = document.createElement('div');
  el.id = 'now-playing';
  el.textContent = 'Loading...';

  return {
    element: el,
    update(title: string) {
      el.textContent = title;
    },
  };
}

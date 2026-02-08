export interface ListenerCountComponent {
  element: HTMLElement;
  update: (count: number) => void;
}

export function createListenerCount(): ListenerCountComponent {
  const el = document.createElement('div');
  el.id = 'listeners';
  el.textContent = 'Listeners: 0';

  return {
    element: el,
    update(count: number) {
      el.textContent = `Listeners: ${count}`;
    },
  };
}

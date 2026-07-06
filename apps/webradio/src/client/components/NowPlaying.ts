export interface NowPlayingComponent {
  element: HTMLElement;
  update: (title: string) => void;
}

// Marquee tuning.
const SCROLL_SPEED = 55; // px per second — constant speed regardless of length
const EDGE_GAP = 56; // px gap between the two copies while scrolling

/**
 * "Now playing" display. Stays on a single fixed-height line so a long title
 * never changes the panel height. When the title overflows, it scrolls
 * horizontally in a seamless loop (Winamp / car-radio style); when it fits it
 * stays centered and static.
 */
export function createNowPlaying(): NowPlayingComponent {
  const el = document.createElement('div');
  el.id = 'now-playing';

  const viewport = document.createElement('div');
  viewport.className = 'np-viewport';

  const marquee = document.createElement('div');
  marquee.className = 'np-marquee';

  const primary = document.createElement('span');
  primary.className = 'np-text';

  // Second copy trails the first so the loop is seamless. Hidden (and ignored
  // by screen readers) unless we are actually scrolling.
  const secondary = document.createElement('span');
  secondary.className = 'np-text np-text--dup';
  secondary.setAttribute('aria-hidden', 'true');

  marquee.appendChild(primary);
  marquee.appendChild(secondary);
  viewport.appendChild(marquee);
  el.appendChild(viewport);

  let currentTitle = 'Loading…';

  function measure(): void {
    // Reset to the static state to measure the natural single-copy width.
    el.classList.remove('is-scrolling');
    marquee.style.removeProperty('animation-duration');

    const textWidth = primary.getBoundingClientRect().width;
    const available = viewport.clientWidth;

    // Not laid out yet, or it fits: keep it centered and static.
    if (available === 0 || textWidth <= available) return;

    const distance = textWidth + EDGE_GAP; // one copy + gap = one loop step
    marquee.style.setProperty('--np-distance', `${distance}px`);
    marquee.style.setProperty('--np-gap', `${EDGE_GAP}px`);
    marquee.style.animationDuration = `${distance / SCROLL_SPEED}s`;
    el.classList.add('is-scrolling');
  }

  function render(): void {
    primary.textContent = currentTitle;
    secondary.textContent = currentTitle;
    // Wait two frames so the browser has laid the text out before measuring.
    requestAnimationFrame(() => requestAnimationFrame(measure));
  }

  render();

  // Re-evaluate on resize (breakpoints change the available width).
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(measure);
  });

  return {
    element: el,
    update(title: string) {
      currentTitle = title;
      render();
    },
  };
}

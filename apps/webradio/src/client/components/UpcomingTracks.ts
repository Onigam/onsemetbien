import * as audioService from '../services/audio';
import type { TrackType, UpcomingTrack } from '../types/events';

export interface UpcomingTracksComponent {
  element: HTMLElement;
  update: (tracks: UpcomingTrack[]) => void;
}

const MAX_ITEMS = 5;

const TYPE_LABELS: Record<TrackType, string> = {
  music: 'Musique',
  excerpt: 'Extrait',
  sketch: 'Sketch',
  jingle: 'Jingle',
};

export function createUpcomingTracks(): UpcomingTracksComponent {
  const el = document.createElement('section');
  el.id = 'upcoming';

  const heading = document.createElement('h2');
  heading.className = 'upcoming-title';
  heading.textContent = 'À suivre';

  const list = document.createElement('ol');
  list.className = 'upcoming-list';

  const empty = document.createElement('div');
  empty.className = 'upcoming-empty';
  empty.textContent = 'Rien en attente pour le moment.';

  el.appendChild(heading);
  el.appendChild(list);
  el.appendChild(empty);

  function render(tracks: UpcomingTrack[]): void {
    list.replaceChildren();

    const items = tracks.slice(0, MAX_ITEMS);

    if (items.length === 0) {
      empty.style.display = 'block';
      list.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    list.style.display = 'flex';

    for (const track of items) {
      const li = document.createElement('li');
      li.className = 'upcoming-item';

      const badge = document.createElement('span');
      badge.className = `upcoming-badge upcoming-badge--${track.type}`;
      badge.textContent = TYPE_LABELS[track.type] ?? track.type;

      const title = document.createElement('span');
      title.className = 'upcoming-item-title';
      title.textContent = track.title;

      li.appendChild(badge);
      li.appendChild(title);

      if (track.duration) {
        const duration = document.createElement('span');
        duration.className = 'upcoming-item-duration';
        duration.textContent = audioService.formatTime(track.duration);
        li.appendChild(duration);
      }

      list.appendChild(li);
    }
  }

  render([]);

  return {
    element: el,
    update(tracks: UpcomingTrack[]) {
      render(tracks);
    },
  };
}

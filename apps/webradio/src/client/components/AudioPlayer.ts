import * as audioService from '../services/audio';

export interface AudioPlayerComponent {
  element: HTMLElement;
  updateProgress: (current: number, duration: number) => void;
  setPlaying: (playing: boolean) => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgIcon(pathD: string, width: number, height: number, id: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', id);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);

  return svg;
}

export function createAudioPlayer(): AudioPlayerComponent {
  const container = document.createElement('div');
  container.id = 'custom-player';

  // Play/Pause button
  const playPauseBtn = document.createElement('button');
  playPauseBtn.id = 'play-pause-btn';
  playPauseBtn.className = 'play-pause-btn';

  const playIcon = createSvgIcon('M8 5v14l11-7z', 40, 40, 'play-icon');
  const pauseIcon = createSvgIcon('M6 4h4v16H6V4zm8 0h4v16h-4V4z', 40, 40, 'pause-icon');
  pauseIcon.style.display = 'none';

  playPauseBtn.appendChild(playIcon);
  playPauseBtn.appendChild(pauseIcon);

  // Progress container
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';

  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'time-display';

  const currentTimeSpan = document.createElement('span');
  currentTimeSpan.id = 'current-time';
  currentTimeSpan.textContent = '0:00';

  const totalTimeSpan = document.createElement('span');
  totalTimeSpan.id = 'total-time';
  totalTimeSpan.textContent = '0:00';

  timeDisplay.appendChild(currentTimeSpan);
  timeDisplay.appendChild(totalTimeSpan);

  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'progress-bar-container';

  const progressBar = document.createElement('div');
  progressBar.id = 'progress-bar';
  progressBar.className = 'progress-bar';

  progressBarContainer.appendChild(progressBar);
  progressContainer.appendChild(timeDisplay);
  progressContainer.appendChild(progressBarContainer);

  // Volume container
  const volumeContainer = document.createElement('div');
  volumeContainer.className = 'volume-container';

  const muteBtn = document.createElement('button');
  muteBtn.id = 'mute-btn';
  muteBtn.className = 'mute-btn';

  const volumeIcon = createSvgIcon(
    'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z',
    24,
    24,
    'volume-icon',
  );
  const muteIcon = createSvgIcon(
    'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    24,
    24,
    'mute-icon',
  );
  muteIcon.style.display = 'none';

  muteBtn.appendChild(volumeIcon);
  muteBtn.appendChild(muteIcon);

  const volumeBarContainer = document.createElement('div');
  volumeBarContainer.className = 'volume-bar-container';

  const volumeBar = document.createElement('div');
  volumeBar.id = 'volume-bar';
  volumeBar.className = 'volume-bar';

  volumeBarContainer.appendChild(volumeBar);
  volumeContainer.appendChild(muteBtn);
  volumeContainer.appendChild(volumeBarContainer);

  // Assemble
  container.appendChild(playPauseBtn);
  container.appendChild(progressContainer);
  container.appendChild(volumeContainer);

  // Event handlers

  // Play/Pause
  playPauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.add('user-interacted');
    console.log('Play/Pause clicked. Current state:', audioService.isPaused() ? 'paused' : 'playing');
    audioService.togglePlayPause();
  });

  // Seek functionality - disabled for radio sync
  progressBarContainer.addEventListener('click', () => {
    // Commenting out seek for radio sync
    // const rect = progressBarContainer.getBoundingClientRect();
    // const percent = (e.clientX - rect.left) / rect.width;
    // audioService.setCurrentTime(percent * audioService.getDuration());
  });

  // Mute/Unmute
  muteBtn.addEventListener('click', () => {
    audioService.toggleMute();
    if (audioService.isMuted()) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
      volumeBar.style.width = '0%';
    } else {
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
      volumeBar.style.width = `${audioService.getVolume() * 100}%`;
    }
  });

  // Volume control
  volumeBarContainer.addEventListener('click', (e) => {
    const rect = volumeBarContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioService.setVolume(percent);
    volumeBar.style.width = `${audioService.getVolume() * 100}%`;

    if (audioService.getVolume() > 0 && audioService.isMuted()) {
      audioService.toggleMute();
      volumeIcon.style.display = 'block';
      muteIcon.style.display = 'none';
    } else if (audioService.getVolume() === 0) {
      volumeIcon.style.display = 'none';
      muteIcon.style.display = 'block';
    }
  });

  // Initialize volume bar
  volumeBar.style.width = `${audioService.getVolume() * 100}%`;

  return {
    element: container,
    updateProgress(current: number, duration: number) {
      if (duration) {
        const progress = (current / duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeSpan.textContent = audioService.formatTime(current);
        totalTimeSpan.textContent = audioService.formatTime(duration);
      }
    },
    setPlaying(playing: boolean) {
      if (playing) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
    },
  };
}

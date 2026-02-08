const audio = document.createElement('audio');
audio.id = 'audio-player';
audio.autoplay = true;
audio.style.display = 'none';
document.body.appendChild(audio);

// Prevent seeking to maintain radio sync
audio.addEventListener('seeked', (event) => {
  event.preventDefault();
});

export function play(): void {
  audio.play().catch((error) => {
    console.log('Playback failed:', error);
  });
}

export function pause(): void {
  audio.pause();
}

export function togglePlayPause(): void {
  if (audio.paused) {
    console.log('Attempting to play...');
    play();
  } else {
    console.log('Attempting to pause...');
    pause();
  }
}

export function setSource(url: string): void {
  audio.src = url;
}

export function setCurrentTime(time: number): void {
  audio.currentTime = time;
}

export function setVolume(volume: number): void {
  audio.volume = Math.max(0, Math.min(1, volume));
}

export function getVolume(): number {
  return audio.volume;
}

export function toggleMute(): void {
  audio.muted = !audio.muted;
}

export function isMuted(): boolean {
  return audio.muted;
}

export function getCurrentTime(): number {
  return audio.currentTime;
}

export function getDuration(): number {
  return audio.duration;
}

export function isPaused(): boolean {
  return audio.paused;
}

export function hasSource(): boolean {
  return !!audio.src;
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function onPlay(cb: () => void): void {
  audio.addEventListener('play', cb);
}

export function onPause(cb: () => void): void {
  audio.addEventListener('pause', cb);
}

export function onTimeUpdate(cb: () => void): void {
  audio.addEventListener('timeupdate', cb);
}

export function onLoadedMetadata(cb: () => void): void {
  audio.addEventListener('loadedmetadata', cb);
}

export function onDurationChange(cb: () => void): void {
  audio.addEventListener('durationchange', cb);
}

import './styles/index.css';

import { createHeader } from './components/Header';
import { createNowPlaying } from './components/NowPlaying';
import { createListenerCount } from './components/ListenerCount';
import { createSkipVote } from './components/SkipVote';
import { createEqualizer } from './components/Equalizer';
import { createAudioPlayer } from './components/AudioPlayer';
import { createUpcomingTracks } from './components/UpcomingTracks';
import * as socketService from './services/socket';
import * as audioService from './services/audio';

// Create all components
const header = createHeader();
const nowPlaying = createNowPlaying();
const listenerCount = createListenerCount();
const skipVote = createSkipVote(() => socketService.emitVoteSkip());
const equalizer = createEqualizer();
const audioPlayer = createAudioPlayer();
const upcoming = createUpcomingTracks();

// Build DOM structure
const app = document.getElementById('app');
if (app) {
  app.appendChild(header);

  const playerInfo = document.createElement('div');
  playerInfo.id = 'player-info';
  playerInfo.appendChild(nowPlaying.element);
  playerInfo.appendChild(listenerCount.element);
  playerInfo.appendChild(skipVote.element);
  app.appendChild(playerInfo);

  app.appendChild(upcoming.element);
  app.appendChild(equalizer.element);
  app.appendChild(audioPlayer.element);
}

// Wire socket events
socketService.onConnect(() => {
  console.log('Connected to server');
});

socketService.onDisconnect(() => {
  console.log('Disconnected from server');
});

socketService.onTrackChange((track) => {
  console.log('Track changed:', track);
  nowPlaying.update(track.title);
  audioService.playPreloadedOrSet(track.url);
  skipVote.reset();

  // Late-joiners / reconnects seek to the live position; a fresh switch starts
  // at 0 (playPreloadedOrSet already reset a gapless swap to 0).
  if (track.currentPosition) {
    audioService.setCurrentTime(track.currentPosition);
  } else {
    audioService.setCurrentTime(0);
  }

  if (document.body.classList.contains('user-interacted')) {
    audioService.play();
  }
});

socketService.onPreloadNext(({ url }) => {
  if (url) {
    audioService.preload(url);
  }
});

socketService.onUpcoming(({ tracks }) => {
  upcoming.update(tracks);
});

socketService.onListenersUpdate((count) => {
  console.log('Listeners updated:', count);
  listenerCount.update(count);
});

socketService.onSkipVotesUpdate((data) => {
  console.log('Skip votes updated:', data);
  skipVote.updateVotes(data.votes, data.required);
});

// Wire audio events
audioService.onPlay(() => {
  console.log('Audio play event fired');
  equalizer.setPlaying(true);
  audioPlayer.setPlaying(true);
});

audioService.onPause(() => {
  console.log('Audio pause event fired');
  equalizer.setPlaying(false);
  audioPlayer.setPlaying(false);
});

audioService.onTimeUpdate(() => {
  audioPlayer.updateProgress(audioService.getCurrentTime(), audioService.getDuration());
});

audioService.onLoadedMetadata(() => {
  audioPlayer.updateProgress(audioService.getCurrentTime(), audioService.getDuration());
});

audioService.onDurationChange(() => {
  audioPlayer.updateProgress(audioService.getCurrentTime(), audioService.getDuration());
});

// Handle first-click autoplay
document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('#custom-player')) {
    return;
  }
  document.body.classList.add('user-interacted');
  if (audioService.hasSource() && audioService.isPaused()) {
    audioService.play();
  }
});

console.log('On se met bien - TypeScript frontend loaded');

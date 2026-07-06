export type TrackType = 'music' | 'excerpt' | 'sketch' | 'jingle';

export interface TrackChangeEvent {
  title: string;
  url: string;
  type: TrackType;
  duration: number;
  startTime: number;
  currentPosition?: number;
  skipVotes: number;
}

export interface SkipVotesUpdateEvent {
  votes: number;
  required: number;
}

export interface PreloadNextEvent {
  url: string | null;
}

export interface UpcomingTrack {
  title: string;
  type: TrackType;
  duration?: number;
}

export interface UpcomingEvent {
  tracks: UpcomingTrack[];
}

export interface ServerToClientEvents {
  trackChange: (track: TrackChangeEvent) => void;
  listenersUpdate: (count: number) => void;
  skipVotesUpdate: (data: SkipVotesUpdateEvent) => void;
  preloadNext: (data: PreloadNextEvent) => void;
  upcoming: (data: UpcomingEvent) => void;
}

export interface ClientToServerEvents {
  voteSkip: () => void;
}

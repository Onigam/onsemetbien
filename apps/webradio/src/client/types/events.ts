export type TrackType = 'music' | 'excerpt' | 'sketch' | 'jingle';

export interface TrackChangeEvent {
  title: string;
  url: string;
  type: TrackType;
  startTime: number;
  currentPosition?: number;
  skipVotes: number;
}

export interface SkipVotesUpdateEvent {
  votes: number;
  required: number;
}

export interface ServerToClientEvents {
  trackChange: (track: TrackChangeEvent) => void;
  listenersUpdate: (count: number) => void;
  skipVotesUpdate: (data: SkipVotesUpdateEvent) => void;
}

export interface ClientToServerEvents {
  voteSkip: () => void;
}

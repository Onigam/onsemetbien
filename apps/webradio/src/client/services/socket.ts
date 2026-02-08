import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  TrackChangeEvent,
  SkipVotesUpdateEvent,
} from '../types/events';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket: TypedSocket = io();

export function emitVoteSkip(): void {
  socket.emit('voteSkip');
}

export function onTrackChange(callback: (track: TrackChangeEvent) => void): void {
  socket.on('trackChange', callback);
}

export function onListenersUpdate(callback: (count: number) => void): void {
  socket.on('listenersUpdate', callback);
}

export function onSkipVotesUpdate(callback: (data: SkipVotesUpdateEvent) => void): void {
  socket.on('skipVotesUpdate', callback);
}

export function onConnect(callback: () => void): void {
  socket.on('connect', callback);
}

export function onDisconnect(callback: () => void): void {
  socket.on('disconnect', callback);
}

export { socket };

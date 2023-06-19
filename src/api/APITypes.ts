// Vendor imports
import { createContext } from 'react';

export const WebSocketContext = createContext<WebSocket | undefined>(undefined);

/** Generic wrapper for message payloads returned from server. */
export interface ServerMessage<T = Record<string, unknown>> {
  error?: string;
  payload?: T;
}

export interface ObjectId {
  $oid: string;
}

export interface Datetime {
  $date: string;
}

export type EventInsert =
  | ['player', ObjectId]
  | ['currency', number]
  | ['bundle', string];

export interface Event {
  _id: ObjectId;
  time: Datetime;
  key: string;
  inserts: EventInsert[];
}

export interface Player {
  _id: ObjectId;
  name: string;
  balance: number;
}

export interface CreateLobbyRequest {
  unlimitedBank: boolean;
  freeParking: boolean;
  maxPlayers: number;
  bankBalance: number;
  startingBalance: number;
  currency: string;
}

export interface Lobby {
  _id: ObjectId;
  code: string;
  created: Datetime;
  expires: Datetime;
  disbanded: boolean;
  options: CreateLobbyRequest;
  bank: number;
  freeParking: number;
  banker: ObjectId;
  players: Player[];
}

export interface WSEventMessage {
  lobby: Lobby;
  events: Event[];
}

// OLD TYPINGS BELOW

export interface CreateLobbyResponse {
  code: string;
}

export interface JoinLobbyRequest {
  code: string;
  name: string;
}

export interface JoinLobbyResponse {
  playerId: string;
}

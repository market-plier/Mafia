export enum Roles {
  detective,
  civilian,
  mafia,
  don,
}

export enum GameState {
  Lobby,
  MafiaMeet,
  Day,
  Vote,
  MafiaShoot,
  DonCheck,
  DetectiveCheck
}

export interface GameData {
  player: Player;
  players: PlayerWe[]
  day: number;
  gameState: GameState
  currentTurn: number;
  killedPreviousTurn: number;
}

export interface PlayerWe {
  name: string;
  isReady: boolean;
  alive: boolean;
  position: number;
  role: Roles
  isOnVote: boolean;
  hasVoted: boolean;
  voteChoise: number
  voteCount: number;
  putOnVote: PutOnVote;
  wsId: string;
  mediaStream?: MediaStream;
}

export interface PutOnVote{
  hasPutOnVote?: number;
  showAnimation?: boolean
}

export interface Player {
  name: string;
  wsId: string;
  isReady: boolean;
  role: Roles;
  alive: boolean;
  position: number;
  isMafiaReady?: boolean;
  isOnVote: boolean;
  hasVoted: boolean;
  putOnVote: PutOnVote;
  voteCount: number;
  voteChoise: number
  shot: number;
}

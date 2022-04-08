export enum Roles {
  detective,
  civilian,
  mafia,
  don,
}

export enum GameState {
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
  isOnVote: boolean;
  hasVoted: boolean;
  voteChoise: number
  voteCount: number;
  wsId: string;
  mediaStream?: MediaStream;
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
  voteCount: number;
  voteChoise: number
  shot: number;
}

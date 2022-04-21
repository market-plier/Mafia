import { GameData, GameState, Player, Roles } from "./game";
export class PersonalGameDataWe {
  player: Player;
  players: PlayerWe[] = [];
  day = 0;
  killedPreviousTurn = 0;
  currentTurn = 0;
  turnCount = 0;

  gameState: GameState
  constructor(player: Player, players: Player[], gameData: GameData) {
    this.player = player;
    this.players = players.map(x => {
      const player = new PlayerWe(x);
      if (
        (this.player.role === Roles.don || this.player.role === Roles.mafia) &&
        (x.role === Roles.don || x.role === Roles.mafia)) {
        player.role = x.role;
      }
      return player
    });
    this.day = gameData.day;
    this.gameState = gameData.gameState;
    this.killedPreviousTurn = gameData.killedPreviousDay;
    this.currentTurn = gameData.currentTurn;
    this.turnCount = gameData.turnCount;
  }
}
export interface PutOnVote{
  hasPutOnVote?: number;
  showAnimation?: boolean
}
export class PlayerWe {
  name: string = "";
  isReady: boolean = false;
  alive = true;
  position: number;
  role = Roles.civilian;
  isOnVote: boolean;
  hasVoted: boolean;
  putOnVote?: PutOnVote;
  voteCount: number;
  wsId: string;
  constructor(player: Player) {
    this.name = player.name;
    this.isReady = player.isReady;
    this.alive = player.alive;
    this.position = player.position;
    this.isOnVote = player.isOnVote;
    this.hasVoted = player.hasVoted;
    this.voteCount = player.voteCount;
    this.wsId = player.wsId;
    this.putOnVote = player.putOnVote;
  }
}
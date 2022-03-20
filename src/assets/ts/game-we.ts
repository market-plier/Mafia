import { GameData, Player } from "./game";
export class PersonalGameDataWe {
  player: Player;
  players: PlayerWe[] = [];
  day = 0;
  constructor(player: Player, players: Player[]){
    this.player = player;
    this.players = players.map(x => new PlayerWe(x));
  }
}

export class GameDataWe {
  players: PlayerWe[] = [];
  day = 0;
  killedPreviousTurn = 0;
  constructor(gameData: GameData){
    this.players = gameData.players.map(x => new PlayerWe(x));
    this.day = gameData.day;
  }
}
export class PlayerWe {
  name: string = "";
  isReady: boolean = false;
  alive = true;
  position: number;
  isOnVote: boolean;
  hasVoted: boolean;
  voteCount: number;

  constructor(player: Player) {
    this.name = player.name;
    this.isReady = player.isReady;
    this.alive = player.alive;
    this.position = player.position;
    this.isOnVote = player.isOnVote;
    this.hasVoted = player.hasVoted;
    this.voteCount = player.voteCount;
  }
}
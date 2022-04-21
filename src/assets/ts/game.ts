import { io } from "../../app";
import { PersonalGameDataWe, PutOnVote } from "./game-we";
export const gameDataMap = new Map<string, GameData>();
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
  DetectiveCheck,
}
//TODO REFACTOR EVERYTHING))))
export class GameData {
  players: Player[] = [];
  day = 0;
  turnCount = 0;
  currentTurn = 0;
  killedPreviousDay = 0;
  gameState: GameState = GameState.Lobby;

  tryKill() {
    const mafias = this.players.filter(
      (x) => x.role === Roles.don || x.role === Roles.mafia
    );
    if (mafias.every((x) => x.shot === mafias[0].shot && x.shot !== 0)) {
      const killed = this.players.find((x) => x.position === mafias[0].shot)!;
      this.killedPreviousDay = killed.position;
    }
  }
  clear() {
    this.turnCount = 0;
    this.currentTurn = 0;
    this.killedPreviousDay = 0;
    this.players.forEach((x) => {
      x.hasVoted = false;
      x.isOnVote = false;
      x.voteCount = 0;
      x.shot = 0;
      x.hasShot = false;
      x.putOnVote = undefined;
    });
  }
  isLastTurn() {
    return this.players.filter((x) => x.alive).length < this.turnCount;
  }
  toggleReady(playerName: string) {
    const player = this.players.find((x) => x.name === playerName);
    player && (player.isReady = !player?.isReady);
  }
  startGame() {
    this.assignRoles();
    this.shufflePositions();
    this.players.forEach((x) => (x.isReady = false));
    this.gameState = GameState.MafiaMeet;
  }
  assignRoles() {
    //TODO do it better
    const array = [...Array(this.players.length).keys()];
    for (let i = 0; i < (this.players.length > 8 ? 2 : 1); i++) {
      //assign 2 or 1 mafia
      let num = Math.floor(Math.random() * array.length);
      let player = array.splice(num, 1)[0];
      this.players[player].role = Roles.mafia;
      this.players[player].isMafiaReady = false;
    }
    //assign don
    let num = Math.floor(Math.random() * array.length);
    let player = array.splice(num, 1)[0];
    this.players[player].role = Roles.don;
    //assign detective
    num = Math.floor(Math.random() * array.length);
    player = array.splice(num, 1)[0];
    this.players[player].role = Roles.detective;
    //others assigned by default
  }
  shufflePositions() {
    const array = [...Array(this.players.length).keys()];
    this.players.forEach((x) => {
      let num = Math.floor(Math.random() * array.length);
      x.position = array.splice(num, 1)[0] + 1;
    });
  }

  toggleMafiaReady(playerName: string) {
    const player = this.players.find((x) => x.name === playerName);
    player && (player.isMafiaReady = !player?.isMafiaReady);
  }
}
export class Player {
  name: string = "";
  wsId: string = "";
  isReady: boolean = false;
  role: Roles = Roles.civilian;
  alive = true;
  position: number = 0;
  isMafiaReady?: boolean;
  isOnVote = false;
  putOnVote?: PutOnVote;
  hasVoted = false;
  voteCount = 0;
  shot = 0;
  hasShot = false;
  constructor(name: string, wsId: string) {
    this.name = name;
    this.wsId = wsId;
  }
}

export function addReady(playerName: string, room: string) {
  gameDataMap.get(room)?.toggleReady(playerName);
  return !gameDataMap.get(room)?.players.some((x) => !x.isReady);
}

export function addMafiaReady(playerName: string, room: string) {
  gameDataMap.get(room)?.toggleMafiaReady(playerName);
  return !getMafia(room)?.some((x) => !x.isMafiaReady);
}

export function getMafia(room: string) {
  return gameDataMap
    .get(room)
    ?.players.filter((x) => x.role === Roles.mafia || x.role === Roles.don);
}

export function getGameData(room: string, username: string) {
  const gameData = gameDataMap.get(room);
  if (gameData) return getPersonalGameData(gameData, username);
}

export function getPersonalGameData(gameData: GameData, username: string) {
  const user = gameData?.players.find((x) => x.name === username);
  const players = gameData?.players.filter((x) => x.name !== username);
  if (user && players) {
    return new PersonalGameDataWe(user, players, gameData!);
  } else {
    throw new Error();
  }
}

export function initRoom(room: string) {
  if (!gameDataMap.has(room)) {
    gameDataMap.set(room, new GameData());
  }
}

export function joinRoom(room: string, name: string, wsId: string) {
  const gameData = gameDataMap.get(room)!;
  const player = gameData.players?.find((x) => x.name === name);
  if (!player) {
    gameData.players.push(new Player(name, wsId));
  } else {
    player.wsId = wsId;
  }
}

export function putToVote(position: number, room: string, votee: string) {
  const voter = gameDataMap.get(room)!.players.find((x) => x.name === votee);
  if (voter && !voter.putOnVote){
    gameDataMap.get(room)!.players.find((x) => x.position === position)!.isOnVote =
    true;
    voter.putOnVote = {hasPutOnVote: position, showAnimation: false};
  }
}

export function vote(sender: string, vote: string, room: string) {
  const gameData = gameDataMap.get(room)!;
  const voter = gameData.players.find((x) => x.name === sender)!;
  const votee = gameData.players.find((x) => x.name === vote)!;
  if (!voter.hasVoted && votee.isOnVote) {
    voter.hasVoted = true;
    votee.voteCount++;
  }
}

export function removePlayer(room: string, username: string) {
  gameDataMap.get(room)!.players = gameDataMap
    .get(room)!
    .players.filter((x) => x.name !== username);
}

export function startGame(room: string) {
  gameDataMap.get(room)?.startGame();
}

export async function startDay(room: string) {
  const gameData = gameDataMap.get(room)!;
  gameData.gameState = GameState.Day;
  gameData && gameData.day++;
  endTurn(room);
}

export function endTurn(room: string) {
  const gameData = gameDataMap.get(room)!;
  if (gameData.killedPreviousDay !== 0) {
    //last words
    if (gameData.currentTurn !== gameData.killedPreviousDay) {
      gameData.currentTurn = gameData.killedPreviousDay;
      sendEveryonePersonalData(gameData);
      return;
    }
    //last words end
    else {
      gameData.players.find(
        (x) => x.position === gameData.killedPreviousDay
      )!.alive = false;
      gameData.clear();
    }
  }
  //normal flow

    const players =
      gameData?.players.sort((a,b) => a.position - b.position).filter((x) => x.alive) ?? [];
    gameData.currentTurn =
      players[(gameData.day + gameData.turnCount - 1) % players.length].position;
    gameData.turnCount++; //TODO make it better. looks bad

  if (gameData.isLastTurn()) {
    gameData.clear();
    gameData.gameState = GameState.MafiaShoot;
    setTimeout(() => {
      io.to(room).emit("end day");
    }, 3000);
  }
  sendEveryonePersonalData(gameData);
}
export function mafiaShoot(room: string) {
  const gameData = gameDataMap.get(room)!;
  gameData.tryKill();
  gameData.gameState = GameState.DetectiveCheck;
  sendEveryonePersonalData(gameData);
}

export function mafiaShot(room: string, position: number, name: string) {
  const gameData = gameDataMap.get(room)!;
  const mafia = gameData.players.find((x) => x.name === name);
  if (mafia && !mafia.hasShot) {
    mafia.shot = position;
    mafia.hasShot = true;
  }
  const mafias = gameData.players.filter(
    (x) => x.role === Roles.mafia || x.role === Roles.don
  );
  if (mafias.every((x) => x.hasShot)) {
    mafiaShoot(room);
  }
}

export function detectiveCheck(room: string, position: number) {
  const gameData = gameDataMap.get(room)!;
  return gameData.players.find((x) => x.position === position)?.role ===
    Roles.civilian
    ? Roles.civilian
    : Roles.mafia;
}

export function donCheck(room: string, position: number) {
  const gameData = gameDataMap.get(room)!;
  return gameData.players.find((x) => x.position === position)?.role ===
    Roles.detective
    ? Roles.detective
    : Roles.civilian;
}

export function sendEveryonePersonalData(gameData: GameData) {
  const users = gameData.players;
  users?.forEach((x) => {
    io.to(x.wsId).emit("game data", getPersonalGameData(gameData, x.name));
  });
}

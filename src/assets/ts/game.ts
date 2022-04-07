import { async } from "rxjs";
import { io } from "../../app";
import { GameDataWe, PersonalGameDataWe } from "./game-we";
export const gameDataMap = new Map<string, GameData>();
export enum Roles {
  detective,
  civilian,
  mafia,
  don,
}
const sleep = require("util").promisify(setTimeout);
export class GameData {
  players: Player[] = [];
  day = 0;
  currentTurn = 0;
  killedPreviousTurn = 0;

  tryKill() {
    const mafias = this.players.filter(
      (x) => x.role === Roles.don || x.role === Roles.mafia
    );
    if (mafias.every((x) => x.shot === mafias[0].shot)) {
      const killed = this.players.find((x) => x.position === mafias[0].shot)!;
      killed.alive = false;
      this.killedPreviousTurn = killed.position;
    }
  }
  clear() {
    this.currentTurn = 0;
    this.players.forEach((x) => {
      x.hasVoted = false;
      x.isOnVote = false;
      x.voteCount = 0;
      x.shot = 0;
    });
  }
  isLastTurn() {
    return this.players.filter((x) => x.alive).length === this.currentTurn;
  }
  toggleReady(playerName: string) {
    const player = this.players.find((x) => x.name === playerName);
    player && (player.isReady = !player?.isReady);
  }
  startGame() {
    this.assignRoles();
    this.shufflePositions();
    this.players.forEach((x) => (x.isReady = false));
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
  hasVoted = false;
  voteCount = 0;
  shot = 0;
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
  gameDataMap.get(room)?.toggleReady(playerName);
  return !getMafiaSockets(room)?.some((x) => !x.isMafiaReady);
}

export function getMafiaSockets(room: string) {
  return gameDataMap.get(room)?.players.filter((x) => x.role === Roles.mafia);
}

export function getGameData(room: string, username: string) {
  const gameData = gameDataMap.get(room);
  const user = gameData?.players.find((x) => x.name === username);
  const players = gameData?.players.filter(x => x.name !== username);
  if (user && players) {
    return new PersonalGameDataWe(user, players);
  } else {
    throw new Error();
  }
}

export function getFullGameData(room: string){
  const gameData = gameDataMap.get(room)!;
  return new GameDataWe(gameData);
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

export function putToVote(playerName: string, room: string) {
  gameDataMap.get(room)!.players.find((x) => x.name === playerName)!.isOnVote =
    true;
}

export function vote(sender: string, vote: string, room: string) {
  const gameData = gameDataMap.get(room)!;
  const voter = gameData.players.find((x) => x.name === sender)!;
  const votee = gameData.players.find((x) => x.name === vote)!;
  if (!voter.hasVoted && votee.isOnVote) voter.hasVoted = true;
  votee.voteCount++;
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
  gameData && gameData.day++;
  gameData && io.to(room).emit("start day", new GameDataWe(gameData));
  await sleep(3000);
  nextTurn(room);
}

export function nextTurn(room: string) {
  const gameData = gameDataMap.get(room)!;
  const players =
    gameData?.players.sort((x) => x.position).filter((x) => x.alive) ?? [];
  gameData.currentTurn++;
  io.to(room).emit(
    "person turn",
    players[(gameData.day - 1) % players.length].position
  );

  if (gameData.isLastTurn()) {
    io.to(room).emit("end day");
    mafiaShoot(room);
  }
}
export async function mafiaShoot(room: string) {
  const gameData = gameDataMap.get(room)!;
  await sleep(15000);
  gameData.tryKill();
}

export function mafiaShot(room: string, position: number, name: string) {
  const gameData = gameDataMap.get(room)!;
  gameData.players.find((x) => x.name === name)!.shot = position;
}

export function detectiveCheck(room: string, position: number) {
  const gameData = gameDataMap.get(room)!;
  return gameData.players.find((x) => x.position === position)?.role === Roles.civilian
    ? Roles.civilian
    : Roles.mafia;
}

export function donCheck(room: string, position: number) {
  const gameData = gameDataMap.get(room)!;
  gameData.clear();
  return gameData.players.find((x) => x.position === position)?.role === Roles.detective
    ? Roles.detective
    : Roles.civilian;
}

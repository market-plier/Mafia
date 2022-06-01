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
  WordsBeforeSecondVote,
  SecondVote,
  VoteToHang,
}
//TODO Move gamedata specific logic to GameData class
export class GameData {
  players: Player[] = [];
  voteQueue: Player[] = [];
  day = 0;
  votesForHangCount = 0;
  turnCount = 0;
  currentTurn = 0;
  killedPreviousDay = 0;
  votingFor = 0;
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
    this.voteQueue = [];
    this.votingFor = 0;
    this.votesForHangCount = 0;
    this.players.forEach((x) => {
      x.hasVoted = false;
      x.isOnVote = false;
      x.voteCount = 0;
      x.shot = 0;
      x.votedFor = 0;
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
  votedFor = 0;
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
  const gameData = getGameDataByRoom(room)!;
  const player = gameData.players?.find((x) => x.name === name);
  if (!player) {
    gameData.players.push(new Player(name, wsId));
  } else {
    player.wsId = wsId;
  }
}

export function canJoinGame(room: string, name: string) {
  const gameData = getGameDataByRoom(room)!;
  const player = gameData.players?.find((x) => x.name === name);
  if (!player){
    if (gameData.gameState === GameState.Lobby){
      return true;
    }
    return false;
  }
  else{
    return true;
  }
}

export function getGameDataByRoom(room: string) {
  return gameDataMap.get(room)!;
}

export function putToVote(position: number, room: string, voterName: string) {
  const gameData = getGameDataByRoom(room);
  if (gameData.gameState === GameState.VoteToHang) {
    gameData.votesForHangCount++;
  } else {
    const voter = gameData.players.find((x) => x.name === voterName);
    const votee = gameData.players.find((x) => x.position === position);
    if (voter && !voter.putOnVote && votee) {
      votee.isOnVote = true;
      voter.putOnVote = { hasPutOnVote: position, showAnimation: false };
      gameData.voteQueue.push(votee);
    }
  }
}

export function vote(sender: string, vote: number, room: string) {
  const gameData = getGameDataByRoom(room);
  const voter = gameData.players.find((x) => x.name === sender)!;
  const votee = gameData.players.find((x) => x.position === vote)!;
  if (!voter.hasVoted && votee.isOnVote) {
    voter.hasVoted = true;
    voter.votedFor = votee.position;
    votee.voteCount++;
  }
}

export function removePlayer(room: string, username: string) {
  getGameDataByRoom(room).players = gameDataMap
    .get(room)!
    .players.filter((x) => x.name !== username);
}

export function startGame(room: string) {
  gameDataMap.get(room)?.startGame();
}

export async function startDay(room: string) {
  const gameData = getGameDataByRoom(room);
  gameData.gameState = GameState.Day;
  gameData && gameData.day++;
  endTurn(room);
}

export function endTurn(room: string) {
  const gameData = getGameDataByRoom(room);
  switch (gameData.gameState) {
    case GameState.Day:
      endTurnDay(gameData, room);
      break;

    case GameState.WordsBeforeSecondVote:
      endTurnBeforeSecondVote(gameData, room);
      break;
  }
}

function endTurnBeforeSecondVote(gameData: GameData, room: string) {
  const player = gameData.players
    .filter((player) => player.isOnVote)
    .sort((a, b) => a.position - b.position)[gameData.turnCount - 1];
  if (player) {
    gameData.currentTurn = player.position;
    gameData.turnCount++;
  } else {
    gameData.gameState = GameState.SecondVote;
    startVoting(room, gameData);
  }
}

function endTurnDay(gameData: GameData, room: string) {
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
    gameData?.players
      .sort((a, b) => a.position - b.position)
      .filter((x) => x.alive) ?? [];
  gameData.currentTurn =
    players[(gameData.day + gameData.turnCount - 1) % players.length].position;
  gameData.turnCount++;

  if (gameData.isLastTurn()) {
    const votees = gameData.players.filter((player) => player.isOnVote);
    if (votees.length) {
      gameData.gameState = GameState.Vote;
      startVoting(room, gameData);
    } else {
      gameData.clear();
      gameData.gameState = GameState.MafiaShoot;
      setTimeout(() => {
        io.to(room).emit("end day");
      }, 3000);
    }
  }
  sendEveryonePersonalData(gameData);
}

export function mafiaShoot(room: string) {
  const gameData = getGameDataByRoom(room);
  gameData.tryKill();
  gameData.gameState = GameState.DetectiveCheck;
  sendEveryonePersonalData(gameData);
}

export function mafiaShot(room: string, position: number, name: string) {
  const gameData = getGameDataByRoom(room);
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
  const gameData = getGameDataByRoom(room);
  return gameData.players.find((x) => x.position === position)?.role ===
    Roles.civilian
    ? Roles.civilian
    : Roles.mafia;
}

export function donCheck(room: string, position: number) {
  const gameData = getGameDataByRoom(room);
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

export function startVoting(room: string, gameData: GameData) {
  if (gameData.voteQueue.length === 1) {
    startVoteToHang(gameData, room);
  } else {
    gameData.votingFor = gameData.voteQueue.shift()?.position ?? 0;
    sendEveryonePersonalData(gameData);
    if (gameData.votingFor !== 0) {
      let counter = 10;
      let WinnerCountdown = setInterval(function () {
        io.to(room).emit("votingCounter", counter);
        counter--;
        if (counter === 0) {
          clearInterval(WinnerCountdown);
          startVoting(room, gameData);
        }
      }, 1000);
    } else {
      const votees = gameData.players.filter((player) => player.isOnVote);
      const maxVoteCountVotees = votees.reduce(
        (prev, current) => {
          return prev[0].voteCount < current.voteCount
            ? [current]
            : prev[0].voteCount === current.voteCount
            ? [...prev, current]
            : prev;
        },
        [votees.shift()!]
      );
      if (maxVoteCountVotees.length >= 2) {
        gameData.players.forEach((player) => {
          player.isOnVote = false;
          player.hasVoted = false;
        });
        maxVoteCountVotees.forEach((player) => (player.isOnVote = true));
        if (gameData.gameState === GameState.Vote) {
          gameData.gameState = GameState.WordsBeforeSecondVote;
          gameData.currentTurn = maxVoteCountVotees.sort(
            (a, b) => a.position - b.position
          )[0].position;
          gameData.turnCount = 1;
        } else if (gameData.gameState === GameState.SecondVote) {
          startVoteToHang(gameData, room);
        }
      } else {
        startVoteToHang(gameData, room);
      }
      sendEveryonePersonalData(gameData);
    }
  }
}

function startVoteToHang(gameData: GameData, room: string) {
  gameData.gameState = GameState.VoteToHang;
  sendEveryonePersonalData(gameData);
  let counter = 10;
  let WinnerCountdown = setInterval(function () {
    io.to(room).emit("votingCounter", counter);
    counter--;
    if (counter === 0) {
      clearInterval(WinnerCountdown);
      if (gameData.players.length / 2 < gameData.votesForHangCount) {
        gameData.players
          .filter((player) => player.isOnVote)
          .forEach((player) => (player.alive = false));
        console.log(gameData.players);
        //TODO last words
      }
      gameData.clear();
      gameData.gameState = GameState.MafiaShoot;
      sendEveryonePersonalData(gameData);
      io.to(room).emit("end day");
    }
  }, 1000);
}

import { io } from "../app";
import {
  addMafiaReady,
  addReady,
  detectiveCheck,
  donCheck, endTurn, gameDataMap,
  GameState,
  getGameData,
  getMafia,
  initRoom as gameInitRoom,
  joinRoom,
  mafiaShot, putToVote,
  removePlayer, sendEveryonePersonalData, startDay,
  startGame,
  vote
} from "../assets/ts/game";
export const stream = (socket: any) => {
  socket.on("subscribe", (data: any) => {
    let room = socket.adapter.rooms.get(data.room);
    if (!room || room.size < 11) {
      //subscribe/join a room
      socket.join(data.room);
      socket.join(data.socketId);
      console.log(data.socketId);
      //Inform other members in the room of new user's arrival
      if (socket.adapter.rooms.get(data.room)?.size > 1) {
        socket.to(data.room).emit("new user", { socketId: data.socketId });
      } else {
        gameInitRoom(data.room);
      }

      joinRoom(data.room, data.username, data.socketId);
      sendEveryonePersonalData(gameDataMap.get(data.room)!);
    }
  });

  socket.on("newUserStart", (data: any) => {
    socket.to(data.to).emit("newUserStart", { sender: data.sender });
  });

  socket.on("ready", (data: any) => {
    if (addReady(data.sender, data.room)) {
      startGame(data.room);
      setTimeout(() => {
        const users = gameDataMap.get(data.room)?.players;
        users?.forEach((x) => {
          io.to(x.wsId).emit("game start", getGameData(data.room, x.name));
        });
      }, 1000);
    } else {
      io.to(data.room).emit("ready", {
        sender: data.sender,
        ready: gameDataMap
          .get(data.room)
          ?.players.find((x) => x.name === data.sender)?.isReady,
      });
    }
  });

  socket.on("mafia ready", (data: any) => {
    if (addMafiaReady(data.sender, data.room)) {
      const gameData = gameDataMap.get(data.room);
      if (gameData) {
        gameData.day++;
        gameData.gameState = GameState.Day;
        endTurn(data.room);
      }
    } else {
      getMafia(data.room) &&
        io
          .to(getMafia(data.room)!.map((x) => x.wsId))
          .emit("mafia ready", {
            sender: data.sender,
            ready: gameDataMap
              .get(data.room)
              ?.players.find((x) => x.name === data.sender)?.isMafiaReady,
          });
    }
  });

  socket.on("put to vote", (data: any) => {
    putToVote(data.vote, data.room, data.sender);
    io.to(data.room).emit("put to vote", {vote: data.vote, sender: data.sender});
  });

  socket.on("vote", (data: any) => {
    vote(data.sender, data.vote, data.room);
    sendEveryonePersonalData(gameDataMap.get(data.room)!);
  });

  socket.on("next turn", (data: any) => {
    endTurn(data.room);
  });

  socket.on("sdp", (data: any) => {
    socket
      .to(data.to)
      .emit("sdp", { description: data.description, sender: data.sender });
  });

  socket.on("ice candidates", (data: any) => {
    socket.to(data.to).emit("ice candidates", {
      candidate: data.candidate,
      sender: data.sender,
    });
  });

  socket.on("shoot", (data: any) => {
    mafiaShot(data.room, data.position, data.sender);
  });

  socket.on("detective check", (data: any) => {
    socket.emit("detective check", detectiveCheck(data.room, data.position));
    const gameData = gameDataMap.get(data.room);
    if (gameData) {
      gameData.gameState = GameState.DonCheck;
      sendEveryonePersonalData(gameData);
    }
  });

  socket.on("don check", (data: any) => {
    socket.emit("don check", donCheck(data.room, data.position));
    startDay(data.room);
  });

  socket.on("leave", (data: any) => {
    removePlayer(data.room, data.username);
    //TODO
    // socket.to(data.room).emit("leave");
  });
  socket.conn.on("close", () => {
    //   removePlayer(socket.id);
  });
};

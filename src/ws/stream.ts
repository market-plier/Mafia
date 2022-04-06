import { io } from "../app";
import {
  addMafiaReady,
  addReady,
  detectiveCheck,
  donCheck,
  gameDataMap,
  getFullGameData,
  getGameData,
  getMafiaSockets,
  initRoom as gameInitRoom,
  joinRoom,
  mafiaShoot,
  mafiaShot,
  nextTurn,
  putToVote,
  removePlayer,
  startDay,
  startGame,
  vote,
} from "../assets/ts/game";
export const stream = (socket: any) => {
  socket.on("subscribe", (data: any) => {
    let room = socket.adapter.rooms.get(data.room);
    if (!room || room.size < 11) {
      //subscribe/join a room
      socket.join(data.room);
      socket.join(data.socketId);
      console.log(socket.adapter.rooms.get(data.room), socket.id);

      //Inform other members in the room of new user's arrival
      if (socket.adapter.rooms.get(data.room)?.size > 1) {
        socket.to(data.room).emit("new user", { socketId: data.socketId });
      } else {
        gameInitRoom(data.room);
      }
      if (socket.adapter.rooms.get(data.room)?.size == 4){
        gameDataMap.get(data.room)?.startGame()
      }
      joinRoom(data.room, data.username, data.socketId);
      const users = gameDataMap.get(data.room)?.players;
      users?.forEach((x) => {
        io.to(x.wsId).emit("game data", getGameData(data.room, x.name));
      });
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
      });
    } else {
      socket.to(data.room).emit("ready", { sender: data.sender });
    }
  });

  socket.on("mafia ready", (data: any) => {
    if (addMafiaReady(data.sender, data.room)) {
      const gameData = gameDataMap.get(data.room);
      gameData && gameData.day++;
      gameData && io.to(data.room).emit("start day", gameData.day);
    } else {
      getMafiaSockets(data.room) &&
        socket
          .to(getMafiaSockets(data.room))
          .emit("mafia ready", { sender: data.sender });
    }
  });

  socket.on("put to vote", (data: any) => {
    putToVote(data.vote, data.room);
    io.to(data.room).emit("put to vote", data.vote);
  });

  socket.on("vote", (data: any) => {
    vote(data.sender, data.vote, data.room);
    io.to(data.room).emit("vote", getGameData(data.room, data.sender));
  });

  socket.on("next turn", (data: any) => {
    nextTurn(data.room);
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

  socket.on("chat", (data: any) => {
    socket.to(data.room).emit("chat", { sender: data.sender, msg: data.msg });
  });

  socket.on("shoot", (data: any) => {
    mafiaShot(data.room, data.position, data.player);
  });

  socket.on("detective check", (data: any) => {
    socket.emit(
      "detective check",
      detectiveCheck(data.room, data.position)
    );
      io.emit('don turn');
  });

  socket.on("don check", (data: any) => {
    socket.emit(
      "don check",
      donCheck(data.room, data.position)
    );
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

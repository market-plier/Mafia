const stream = (socket) => {

    socket.on('subscribe', (data) => {
        let room = socket.adapter.rooms.get(data.room);
        if (!room || room.size < 11) {
            //subscribe/join a room
            socket.join(data.room);
            socket.join(data.socketId);
            console.log(socket.adapter.rooms, socket.adapter.rooms.get(data.room).size)

            //Inform other members in the room of new user's arrival
            if (socket.adapter.rooms.get(data.room)?.size > 1) {
                socket.to(data.room).emit('new user', { socketId: data.socketId });
            }
        }

    });

    socket.on('ready', (data) =>
    {
        socket.to(data.room)//todo
    });

    socket.on('newUserStart', (data) => {
        socket.to(data.to).emit('newUserStart', { sender: data.sender });
    });


    socket.on('sdp', (data) => {
        socket.to(data.to).emit('sdp', { description: data.description, sender: data.sender });
    });


    socket.on('ice candidates', (data) => {
        socket.to(data.to).emit('ice candidates', { candidate: data.candidate, sender: data.sender });
    });


    socket.on('chat', (data) => {
        socket.to(data.room).emit('chat', { sender: data.sender, msg: data.msg });
    });
};

module.exports = stream;

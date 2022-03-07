let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server, { cors: { origin: '*' } });
let stream = require('./ws/stream');


io.on('connection', stream);

server.listen(3000);


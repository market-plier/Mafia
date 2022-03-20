import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import { stream } from './ws/stream';
let app = express();
let server = new http.Server(app);
export const io = new socketIo.Server(server, { cors: { origin: '*' } });

io.on('connection', stream);

server.listen(3000);


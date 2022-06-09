console.log('Starting server...');
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import { stream } from './ws/stream';
import path from 'path'
import { gameDataMap } from './assets/ts/game';
let app = express();
let server = new http.Server(app);
export const io = new socketIo.Server(server, { cors: { origin: '*' } });
app.use('/', express.static(path.join(__dirname, 'public/app')));

app.get('/clear', (req, res) => {
    gameDataMap.clear();
    res.status(200).send('done');
  })

app.all('/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', { root: path.join(__dirname, 'public/app') });
});

io.on('connection', stream);
const PORT = process.env.PORT || 8080;
server.listen(PORT);
console.log('Server started)');
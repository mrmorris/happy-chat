'use strict';

const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const CHAT_TOKEN = process.env.CHAT_TOKEN;

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', (ws, req) => {
	const params = url.parse(req.url, true).query;

	if (CHAT_TOKEN && (!params.token || params.token != CHAT_TOKEN)) {
		console.log('Client connection refused');
		ws.send('unauthorized');
		ws.close();
		return;
	}

  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));

	ws.on("message", message => {
    ws.send(message);
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // setting up a manual "ping" message to keep the connection alive
  // apparently in Heroku, the connection will timeout in 60s without this...
  // a client could also be the one pinging the server
  setInterval(() => {
    ws.send("");
  }, 30 * 1000);

  ws.send(
    JSON.stringify({
      user: "Happy Server",
      message: "Welcome!"
    })
  );
});

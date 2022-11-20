require('dotenv').config();

const { WebSocketServer } = require('ws');
const { CortexClient } = require('./cortex-client');

const websocketServer = new WebSocketServer({ port: 6969 });
console.log('Server started');

websocketServer.on('connection', function connection(ws) {  
  ws.send('Client Connected');
  
  const cortexClient = new CortexClient({ websocketServer: ws });

  cortexClient.stream();
});

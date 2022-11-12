const WebSocketClient = require('websocket').client;

const {
  getSessionTokenRequest,
  createSessionRequest,
  createMentalCommandStreamRequest,
} = require('./cortex-requests');

const sessionStates = {
  inactive: 'inactive',
  authorizationTokenReceived: 'authorizationTokenReceived',
  activated: 'activated',
  error: 'error',
}

const responseTypes = {
  authorizationTokenReceived: 'authorizationTokenReceived',
  sessionIdReceived: 'sessionIdReceived',
  mentalCommandStreamCreated: 'mentalCommandStreamCreated',
}

class CortexClient {
  constructor({ headset, websocketServer }) {
    this.clientId = process.env.CORTEX_CLIENT_ID;
    this.clientSecret = process.env.CORTEX_CLIENT_SECRET;
    this.headset = headset || process.env.CORTEX_HEADSET;
    
    this.sessionState = sessionStates.inactive;
    this.cortexToken = undefined;
    this.sessionId = undefined;
    this.streamName = undefined;

    this.websocketServer = websocketServer; 
    this.websocketClient = new WebSocketClient();
  }

  stream() {
    const websocketServer = this.websocketServer;
    this.websocketClient.on.bind(this);

    this.websocketClient.on('connect', function(wsClient) {
      console.log('Initiating cortex connection');

      if (wsClient.connected) {
        wsClient.sendUTF(getSessionTokenRequest.stringify());
      }

      wsClient.on('message', function(messageData) {
        const message = JSON.parse(messageData.utf8Data);
        
        function _resolveResponse(message) {
          const { error } = message;
          if (error) {
            throw error;
          }

          const { com: mentalCommand } = message;
          if (mentalCommand) {
            return responseTypes.mentalCommandReceived;
          }
          
          const mentalCommandStreamCreated = message?.result?.success?.[0].streamName;
          if (mentalCommandStreamCreated) {
            return responseTypes.mentalCommandReceived;
          }
      
          const { result: { id: sessionId } } = message;
          if (sessionId) {
            return responseTypes.sessionIdReceived;
          }
      
          const { result: { cortexToken } } = message;
          if (cortexToken) {
            return responseTypes.authorizationTokenReceived;
          }
      
          throw new Error('Unknown response type: ', message);
        }

        function _handleAuthorizationToken({ wsClient, message }) {
          const cortexToken = message.result.cortexToken;
      
          this.cortexToken = cortexToken;
          this.sessionState = sessionStates.authorizationTokenReceived;
      
          wsClient.sendUTF(createSessionRequest.stringify({ cortexToken }));
        }
      
        function _handleSessionId({ wsClient, message }) {
          const sessionId = message.result.id;
      
          this.sessionId = sessionId;
          this.sessionState = sessionStates.sessionIdReceived;
      
          wsClient.sendUTF(createMentalCommandStreamRequest.stringify({ cortexToken: this.cortexToken, sessionId }));
        }

        function _handleMentalCommandStreamCreation({ message }) {
          this.sessionState = sessionStates.mentalCommandStreamCreated;
          this.streamName = message.result.success[0].streamName;
        }
      
        function _handleMentalCommand({ websocketServer, message }) {
          websocketServer.send(JSON.stringify(message));
        }

        try {
          const responseType = _resolveResponse(message);
          
          const responseHandler = {
            [responseTypes.authorizationTokenReceived]: _handleAuthorizationToken,
            [responseTypes.sessionIdReceived]: _handleSessionId,
            [responseTypes.mentalCommandStreamCreated]: _handleMentalCommandStreamCreation,
            [responseTypes.mentalCommandReceived]: _handleMentalCommand,
          }
          
          const handler = responseHandler[responseType];
          
          handler.apply(this, [ { websocketServer, wsClient, message } ]);

        } catch (error) {
          const errorMessage = `[${error.code}] ${error.message}`;

          console.error(errorMessage);

          websocketServer.send(JSON.stringify(message));
        }
      });
    });

    this.websocketClient.connect(process.env.CORTEX_SERVER_URL || 'ws://localhost:6868');
  }
}

module.exports = { CortexClient };

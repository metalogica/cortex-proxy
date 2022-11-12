class Requests {
  constructor() {
    this.payload = {
      id: 1,
      jsonrpc: '2.0',
    }
  }

  stringify() {
    return JSON.stringify(this.payload);
  }
}

class GetSessionTokenRequest extends Requests {
  constructor() {
    super();

    this.payload.method = 'authorize';
    this.payload.params = {
      clientId: process.env.CORTEX_CLIENT_ID,
      clientSecret: process.env.CORTEX_CLIENT_SECRET,
      debit: 1 
    }
  }
}


class CreateSessionRequest extends Requests {
  constructor() {
    super();

    this.payload.method = 'createSession';
  }

  stringify({ cortexToken, headset }) {
    this.payload.params = {
      cortexToken,
      headset: headset || process.env.CORTEX_HEADSET,
      status: 'open',
    } 

    return JSON.stringify(this.payload);
  }
}


class CreateMentalCommandStreamRequest extends Requests {
  constructor() {
    super();
    
    this.payload.method = 'subscribe';
  }

  stringify({ cortexToken, sessionId }) {
    this.payload.params = {
      cortexToken,
      session: sessionId,
      streams: [ 
        'com' 
      ],
    }

    return JSON.stringify(this.payload);
  }
}

const getSessionTokenRequest = new GetSessionTokenRequest();
const createSessionRequest = new CreateSessionRequest();
const createMentalCommandStreamRequest = new CreateMentalCommandStreamRequest();

module.exports = {
  getSessionTokenRequest,
  createSessionRequest,
  createMentalCommandStreamRequest,
};

export async function createSession({ participants }) {
    // For demo: pretend we called Collaboration Service and got a room.
    return {
      sessionId: `S_${Date.now()}`,
      wsUrl: 'wss://collab.example/room',
      wsAuthToken: 'demo-token'
    };
  }
  
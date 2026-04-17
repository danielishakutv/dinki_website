import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || 'https://be.dinki.africa';

let socket = null;
let reconnectTimer = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;

  // Disconnect existing before reconnecting
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.on('connect_error', (err) => {
    if (err.message === 'INVALID_TOKEN' || err.message === 'AUTH_REQUIRED') {
      // Token expired — retry with fresh token after a delay
      if (!reconnectTimer) {
        reconnectTimer = setInterval(() => {
          const freshToken = getToken();
          if (freshToken && socket) {
            socket.auth = { token: freshToken };
            socket.connect();
          }
        }, 5000);
      }
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { signalPayloadSchema, signalingRoomSchema } from './events';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './events';

export function attachSignalingServer(httpServer: HttpServer) {
  const allowedOrigins = process.env.SIGNALING_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: { origin: allowedOrigins },
  });

  io.on('connection', (socket) => {
    socket.on('room:join', (payload) => {
      const parsed = signalingRoomSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('signal:error', { event: 'room:join', message: 'Invalid room join payload' });
        return;
      }

      const { roomId, role } = parsed.data;
      const existingSockets = io.sockets.adapter.rooms.get(roomId) ?? new Set<string>();
      for (const socketId of existingSockets) {
        if (socketId === socket.id) continue;
        const peerSocket = io.sockets.sockets.get(socketId);
        if (peerSocket?.data.role === role) {
          socket.emit('signal:error', { event: 'room:join', message: `A ${role} is already connected to this room.` });
          return;
        }
      }
      socket.data.roomId = roomId;
      socket.data.role = role;
      socket.join(roomId);
      socket.to(roomId).emit('room:peer-joined', { roomId, role });

      const roomSockets = io.sockets.adapter.rooms.get(roomId) ?? new Set<string>();
      for (const socketId of roomSockets) {
        if (socketId === socket.id) continue;
        const peerSocket = io.sockets.sockets.get(socketId);
        if (peerSocket?.data.role) {
          socket.emit('room:peer-joined', { roomId, role: peerSocket.data.role });
        }
      }
    });

    function forwardSignal(event: 'signal:offer' | 'signal:answer' | 'signal:ice-candidate', payload: unknown) {
      const parsed = signalPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit('signal:error', { event, message: 'Invalid signaling payload' });
        return;
      }

      if (socket.data.roomId !== parsed.data.roomId || socket.data.role !== parsed.data.from) {
        socket.emit('signal:error', { event, message: 'Signaling payload does not match joined room or role' });
        return;
      }

      socket.to(parsed.data.roomId).emit(event, parsed.data);
    }

    socket.on('signal:offer', (payload) => forwardSignal('signal:offer', payload));
    socket.on('signal:answer', (payload) => forwardSignal('signal:answer', payload));
    socket.on('signal:ice-candidate', (payload) => forwardSignal('signal:ice-candidate', payload));
  });

  return io;
}

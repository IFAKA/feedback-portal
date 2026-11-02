import { z } from 'zod';

export const peerRoleSchema = z.enum(['host', 'tester']);
export type PeerRole = z.infer<typeof peerRoleSchema>;

export const signalingRoomSchema = z.object({
  roomId: z.string().trim().min(4).max(80),
  role: peerRoleSchema,
});

const rtcSignalSchema = z.record(z.string(), z.unknown());

export const signalPayloadSchema = z.object({
  roomId: z.string().trim().min(4).max(80),
  from: peerRoleSchema,
  signal: rtcSignalSchema,
});

export type SignalPayload = z.infer<typeof signalPayloadSchema>;
export type RoomJoinPayload = z.infer<typeof signalingRoomSchema>;

export type ClientToServerEvents = {
  'room:join': (payload: RoomJoinPayload) => void;
  'signal:offer': (payload: SignalPayload) => void;
  'signal:answer': (payload: SignalPayload) => void;
  'signal:ice-candidate': (payload: SignalPayload) => void;
};

export type ServerToClientEvents = {
  'room:peer-joined': (payload: RoomJoinPayload) => void;
  'signal:offer': (payload: SignalPayload) => void;
  'signal:answer': (payload: SignalPayload) => void;
  'signal:ice-candidate': (payload: SignalPayload) => void;
  'signal:error': (payload: { event: keyof ClientToServerEvents; message: string }) => void;
};

export type InterServerEvents = Record<string, never>;
export type SocketData = { roomId?: string; role?: PeerRole };

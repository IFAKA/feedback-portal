'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, SignalPayload } from '@/server/signaling/events';

type SignalingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type ConnectionState = 'idle' | 'connecting' | 'joined' | 'receiving-offer' | 'connecting-media' | 'streaming' | 'empty' | 'error';

const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function asSignalPayload(roomId: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit): SignalPayload {
  return { roomId, from: 'tester', signal: signal as Record<string, unknown> };
}

export function TesterSignalingPanel() {
  const [roomId, setRoomId] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [statusMessage, setStatusMessage] = useState('Enter a host room ID to receive the host screen share.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<SignalingSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingRemoteCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const canJoin = useMemo(() => roomId.trim().length >= 4 && connectionState !== 'connecting', [connectionState, roomId]);

  useEffect(() => cleanup, []);

  function cleanup() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    pendingRemoteCandidatesRef.current = [];
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  async function flushRemoteCandidates(peer: RTCPeerConnection) {
    const pending = pendingRemoteCandidatesRef.current.splice(0);
    for (const candidate of pending) await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  function showError(error: unknown) {
    const message = error instanceof Error ? error.message : 'The tester connection failed.';
    cleanup();
    setConnectionState('error');
    setErrorMessage(message);
    setStatusMessage('The remote stream is not available.');
  }

  function joinRoom() {
    const trimmedRoomId = roomId.trim();
    if (trimmedRoomId.length < 4) {
      setConnectionState('error');
      setErrorMessage('Room ID must be at least 4 characters.');
      setStatusMessage('Check the Room ID shown on the host page.');
      return;
    }

    cleanup();
    setErrorMessage(null);
    setConnectionState('connecting');
    setStatusMessage('Connecting to Socket.io signaling...');

    const peer = new RTCPeerConnection(rtcConfig);
    peerRef.current = peer;

    const socket: SignalingSocket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current && stream) remoteVideoRef.current.srcObject = stream;
      setConnectionState('streaming');
      setStatusMessage('Remote host screen share is live.');
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) socket.emit('signal:ice-candidate', asSignalPayload(trimmedRoomId, event.candidate.toJSON()));
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setConnectionState('streaming');
        setStatusMessage('WebRTC media connection established.');
      }
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
        showError(new Error('The WebRTC connection dropped. Ask the host to start sharing again.'));
      }
    };

    socket.on('connect', () => {
      socket.emit('room:join', { roomId: trimmedRoomId, role: 'tester' });
      setConnectionState('joined');
      setStatusMessage('Joined as tester. Waiting for the host to start sharing.');
    });

    socket.on('room:peer-joined', ({ role }) => {
      if (role === 'host') {
        setConnectionState('empty');
        setStatusMessage('Host is in the room. Waiting for a screen-share offer.');
      }
    });

    socket.on('signal:offer', async ({ signal }) => {
      try {
        setConnectionState('receiving-offer');
        setStatusMessage('Received host offer. Creating WebRTC answer...');
        await peer.setRemoteDescription(new RTCSessionDescription(signal as unknown as RTCSessionDescriptionInit));
        await flushRemoteCandidates(peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('signal:answer', asSignalPayload(trimmedRoomId, answer));
        setConnectionState('connecting-media');
        setStatusMessage('Answer sent. Waiting for remote media...');
      } catch (error) {
        showError(error);
      }
    });

    socket.on('signal:ice-candidate', async ({ signal }) => {
      try {
        const candidate = signal as RTCIceCandidateInit;
        if (!peer.remoteDescription) pendingRemoteCandidatesRef.current.push(candidate);
        else await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        showError(error);
      }
    });

    socket.on('signal:error', ({ message }) => showError(new Error(message)));
    socket.on('connect_error', () => showError(new Error('Could not connect to the signaling server. Use npm run dev so Socket.io is available.')));
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-xl" aria-labelledby="tester-signaling-title">
      <div className="grid gap-2">
        <h2 id="tester-signaling-title" className="text-2xl font-black tracking-[-0.03em]">Tester screen-share receiver</h2>
        <p className="text-lg font-semibold text-ink/75">
          Join the host Room ID to receive the MVP one-host, one-tester WebRTC stream through the Socket.io signaling channel.
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        <label htmlFor="tester-room-id" className="text-sm font-bold text-ink">Room ID</label>
        <input
          id="tester-room-id"
          value={roomId}
          onChange={(event) => setRoomId(event.target.value)}
          className="min-h-11 rounded-2xl border border-black/10 bg-paper px-4 outline-none focus:ring-4 focus:ring-copper/20"
          placeholder="ses_1234"
          autoComplete="off"
        />
        <button type="button" onClick={joinRoom} disabled={!canJoin} className="pressable rounded-full bg-ink px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Join tester room
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-2xl border border-black/10 bg-paper p-4" role="status" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">Connection state</p>
          <p className="mt-1 text-lg font-black capitalize">{connectionState.replaceAll('-', ' ')}</p>
          <p className="mt-2 text-sm font-semibold text-ink/70">{statusMessage}</p>
          {errorMessage ? <p className="mt-2 text-sm font-bold text-red-700">{errorMessage}</p> : null}
        </div>
        <div className="rounded-[1.5rem] border border-black/10 bg-ink p-3">
          <video ref={remoteVideoRef} playsInline autoPlay controls className="aspect-video w-full rounded-[1rem] bg-black object-contain" aria-label="Remote host screen share" />
          {connectionState !== 'streaming' ? <p className="mt-3 text-sm font-semibold text-white/75">No remote stream yet. Join a room and ask the host to press Start Sharing.</p> : null}
        </div>
      </div>
    </section>
  );
}

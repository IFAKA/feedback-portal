'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, SignalPayload } from '@/server/signaling/events';

type SignalingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type ShareState = 'idle' | 'requesting-permission' | 'connecting' | 'waiting-for-tester' | 'sharing' | 'error';

const rtcConfig: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function asSignalPayload(roomId: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit): SignalPayload {
  return { roomId, from: 'host', signal: signal as Record<string, unknown> };
}

export function HostSignalingPanel({ roomId }: { roomId: string }) {
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [statusMessage, setStatusMessage] = useState('Explain what will be shared, then start screen sharing when the tester is ready.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<SignalingSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingRemoteCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => cleanup, []);

  async function createOffer() {
    const socket = socketRef.current;
    const peer = peerRef.current;
    if (!socket || !peer) return;

    setStatusMessage('Tester connected. Creating WebRTC offer...');
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit('signal:offer', asSignalPayload(roomId, offer));
  }

  function cleanup() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    pendingRemoteCandidatesRef.current = [];
    if (previewRef.current) previewRef.current.srcObject = null;
  }

  async function flushRemoteCandidates(peer: RTCPeerConnection) {
    const pending = pendingRemoteCandidatesRef.current.splice(0);
    for (const candidate of pending) await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async function startSharing() {
    cleanup();
    setErrorMessage(null);
    setShareState('requesting-permission');
    setStatusMessage('Your browser is asking what screen, window, or tab to share.');

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (previewRef.current) previewRef.current.srcObject = stream;

      setShareState('connecting');
      setStatusMessage('Screen selected. Connecting to signaling...');

      const peer = new RTCPeerConnection(rtcConfig);
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        cleanup();
        setShareState('idle');
        setStatusMessage('Screen sharing stopped. Start again when you are ready.');
      });

      const socket: SignalingSocket = io({ transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      peer.onicecandidate = (event) => {
        if (event.candidate) socket.emit('signal:ice-candidate', asSignalPayload(roomId, event.candidate.toJSON()));
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
          setShareState('sharing');
          setStatusMessage('Live screen share connected to the tester.');
        }
        if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
          setShareState('error');
          setErrorMessage('The WebRTC connection dropped. Stop and start sharing again.');
        }
      };

      socket.on('connect', () => {
        socket.emit('room:join', { roomId, role: 'host' });
        setShareState('waiting-for-tester');
        setStatusMessage('Connected. Waiting for the tester to join this room.');
      });

      socket.on('room:peer-joined', ({ role }) => {
        if (role === 'tester') void createOffer().catch(showError);
      });

      socket.on('signal:answer', async ({ signal }) => {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(signal as unknown as RTCSessionDescriptionInit));
          await flushRemoteCandidates(peer);
          setStatusMessage('Tester answered. Establishing media connection...');
        } catch (error) { showError(error); }
      });

      socket.on('signal:ice-candidate', async ({ signal }) => {
        try {
          const candidate = signal as RTCIceCandidateInit;
          if (!peer.remoteDescription) pendingRemoteCandidatesRef.current.push(candidate);
          else await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) { showError(error); }
      });

      socket.on('signal:error', ({ message }) => showError(new Error(message)));
      socket.on('connect_error', () => showError(new Error('Could not connect to Socket.io. Make sure the custom server is running.')));
    } catch (error) {
      showError(error);
    }
  }

  function showError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Screen sharing could not start.';
    cleanup();
    setShareState('error');
    setErrorMessage(message);
    setStatusMessage('Sharing is not active. Review the error and try again.');
  }

  return (
    <section className="mb-6 rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-xl" aria-labelledby="host-share-title">
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">Live screen share</p>
        <h2 id="host-share-title" className="text-2xl font-black tracking-[-0.03em]">Share this host screen with one tester</h2>
        <p className="text-sm font-semibold text-ink/70">
          Nothing is shared until you press Start Sharing and approve the browser prompt. Choose a tab, window, or screen intentionally; this MVP supports one host and one tester only.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={startSharing} disabled={shareState === 'requesting-permission' || shareState === 'connecting'} className="pressable rounded-full bg-ink px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Start Sharing
        </button>
        <button type="button" onClick={() => { cleanup(); setShareState('idle'); setStatusMessage('Sharing stopped. Start again when you are ready.'); setErrorMessage(null); }} className="pressable rounded-full border border-black/10 px-5 py-3 font-bold">
          Stop
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_14rem]">
        <div className="rounded-2xl border border-black/10 bg-paper p-4" role="status" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">Status</p>
          <p className="mt-1 text-lg font-black capitalize">{shareState.replaceAll('-', ' ')}</p>
          <p className="mt-2 text-sm font-semibold text-ink/70">{statusMessage}</p>
          {errorMessage ? <p className="mt-2 text-sm font-bold text-red-700">{errorMessage}</p> : null}
        </div>
        <video ref={previewRef} muted playsInline autoPlay className="min-h-32 rounded-2xl border border-black/10 bg-ink object-cover" aria-label="Local screen share preview" />
      </div>
    </section>
  );
}

import { describe, expect, it } from 'vitest';
import type { ClientToServerEvents, ServerToClientEvents } from '@/server/signaling/events';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

describe('signaling event contract', () => {
  it('keeps client and server event names aligned', () => {
    const clientEvents = ['room:join', 'signal:offer', 'signal:answer', 'signal:ice-candidate'] as const satisfies ReadonlyArray<keyof ClientToServerEvents>;
    const serverEvents = ['room:peer-joined', 'signal:offer', 'signal:answer', 'signal:ice-candidate', 'signal:error'] as const satisfies ReadonlyArray<keyof ServerToClientEvents>;
    type _ClientKeysMatch = Expect<Equal<keyof ClientToServerEvents, typeof clientEvents[number]>>;
    type _ServerKeysMatch = Expect<Equal<keyof ServerToClientEvents, typeof serverEvents[number]>>;
    const compileTimeChecks: [_ClientKeysMatch, _ServerKeysMatch] = [true, true];

    expect(clientEvents).toEqual(['room:join', 'signal:offer', 'signal:answer', 'signal:ice-candidate']);
    expect(serverEvents).toContain('signal:answer');
    expect(compileTimeChecks).toEqual([true, true]);
  });
});

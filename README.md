# Feedback Portal MVP

Feedback Portal is a lightweight live usability-review tool. A host creates a session, shares an app window or screen, and the tester joins to watch the live stream. Feedback pins are saved to the session timeline for review afterward.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Use `npm run dev`, not `npm run dev:next`, because the app needs the custom `server.ts` entrypoint. That server runs Next.js and attaches the Socket.io signaling server used by the live WebRTC flow. `npm run dev:next` starts plain Next.js only, so signaling is missing.

## Happy path

1. On the home page, create a session with a project name and tester name.
2. Host: open `/host` from the created session and copy the Room ID.
3. Tester: open `/tester`, enter the Room ID, and wait for the stream.
4. Host: click **Start Sharing**, then choose the app window, simulator, tab, or screen to share.
5. Review: open `/review` to inspect the session timeline after the test.

## Local vs remote usage

- Local testing works when host and tester use the same machine or can reach the same local network address.
- Remote friends cannot reach your `localhost` directly.
- For remote testing, expose the running app with ngrok, Cloudflare Tunnel, or deploy it to a reachable server.
- This app is not a tunnel; it does not make your local machine publicly reachable by itself.

## WebRTC mental model

- Socket.io handles signaling: the browser peers exchange setup messages through the app server.
- The host's browser asks for screen-share permission; the app cannot bypass that prompt.
- Once connected, the screen stream is peer-to-peer between browsers.
- The default setup uses STUN to help peers find a route, not TURN relay infrastructure. Some restrictive networks may still fail without TURN.

## Useful scripts

```bash
npm run dev        # Start Next.js through server.ts with Socket.io signaling
npm run dev:next   # Start plain Next.js only; live signaling is not attached
npm run build      # Build the Next.js app
npm run start      # Run the production server.ts entrypoint
npm run lint       # Run ESLint
npm run test       # Run Vitest
npm run test:e2e   # Run Playwright tests
npm run db:push    # Push Drizzle schema changes
```

## Support

If this project is useful to you, you can support my work:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/zfaka)

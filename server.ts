import { createServer } from 'node:http';
import next from 'next';
import { attachSignalingServer } from './src/server/signaling/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? 'localhost';
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();
const httpServer = createServer((req, res) => handle(req, res));
attachSignalingServer(httpServer);
httpServer.listen(port, () => console.log(`Feedback Portal listening on http://${hostname}:${port}`));

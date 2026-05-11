import { config } from "./config.js";
import { createApp } from "./app.js";
import { createServer } from "node:http";
import { initSocketServer } from "./socket.js";

const app = createApp();
const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Backend API running on http://localhost:${config.port}`);
});

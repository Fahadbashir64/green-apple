import { config } from "./config.js";
import { createApp } from "./app.js";
import { createServer } from "node:http";
import { initSocketServer } from "./socket.js";

const app = createApp();
const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(config.port, "0.0.0.0", () => {
  console.log(`Backend API listening on port ${config.port}`);
});

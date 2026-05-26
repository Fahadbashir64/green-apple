import { config } from "./config.js";
import { createApp } from "./app.js";
import { createServer } from "node:http";
import { initSocketServer } from "./socket.js";

const app = createApp();
const httpServer = createServer(app);

initSocketServer(httpServer);

const PORT = process.env.PORT || config.port || 4000;

httpServer.on("error", (error) => {
  console.error("HTTP server failed to start:", error);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});
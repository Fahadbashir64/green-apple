import express from "express";
import cors from "cors";
import path from "node:path";

import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}

export { createApp };

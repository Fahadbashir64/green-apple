import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";

import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

function hasFrontendBuild(distDir) {
  return fs.existsSync(path.join(distDir, "index.html"));
}

function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
  app.use(config.apiRoutePrefix, apiRouter);

  const distDir = config.frontendDistPath;
  const serveSpa =
    config.serveFrontend && hasFrontendBuild(distDir);

  if (serveSpa) {
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: config.nodeEnv === "production" ? "1d" : 0,
      })
    );

    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      const p = req.path;
      if (
        p.startsWith(config.apiRoutePrefix) ||
        p.startsWith("/uploads")
      ) {
        return next();
      }
      res.sendFile(path.join(distDir, "index.html"), (err) => {
        if (err) {
          next(err);
        }
      });
    });
  }

  app.use(errorHandler);

  return app;
}

export { createApp };

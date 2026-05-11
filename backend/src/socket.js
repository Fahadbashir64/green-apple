import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

let ioInstance = null;

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*"
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || "";
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      socket.data.user = jwt.verify(token, config.jwtSecret);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!user) {
      return;
    }

    socket.join(`user:${user.userId}`);
    if (user.role === "admin") {
      socket.join("admins");
    }
  });

  ioInstance = io;
  return io;
}

function emitOrderCreated(order) {
  if (!ioInstance) return;
  ioInstance.to("admins").emit("order:created", order);
  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit("order:created", order);
  }
}

function emitOrderUpdated(order) {
  if (!ioInstance) return;
  ioInstance.to("admins").emit("order:updated", order);
  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit("order:updated", order);
  }
}

export { emitOrderCreated, emitOrderUpdated, initSocketServer };

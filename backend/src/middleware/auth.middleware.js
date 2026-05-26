import jwt from "jsonwebtoken";
import { config } from "../config.js";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

/** List/update all orders (admin or sub-admin). */
function requireAdminOrSubAdmin(req, res, next) {
  const role = req.user?.role;
  if (!req.user || (role !== "admin" && role !== "sub_admin")) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
}

export { requireAdmin, requireAdminOrSubAdmin, requireAuth };

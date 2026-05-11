import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.middleware.js";
import { login, me, register } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);

export { authRouter };

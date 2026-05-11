import { Router } from "express";
import { authRouter } from "../modules/auth/routes/auth.routes.js";
import { menuRouter } from "../modules/menu/routes/menu.routes.js";
import { ordersRouter } from "../modules/orders/routes/orders.routes.js";
import { healthRouter } from "./health.routes.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/orders", ordersRouter);

export { apiRouter };

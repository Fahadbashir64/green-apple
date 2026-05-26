import { Router } from "express";
import { authRouter } from "../modules/auth/routes/auth.routes.js";
import { menuRouter } from "../modules/menu/routes/menu.routes.js";
import { ordersRouter } from "../modules/orders/routes/orders.routes.js";
import { paypalRouter } from "../modules/payments/routes/paypal.routes.js";
import { healthRouter } from "./health.routes.js";

const apiRouter = Router();

apiRouter.get("/live", (_req, res) => {
  res.json({ status: "live", env: process.env.NODE_ENV || "development" });
});
apiRouter.use("/health", healthRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payments/paypal", paypalRouter);

export { apiRouter };

import { Router } from "express";
import { requireAuth } from "../../../middleware/auth.middleware.js";
import {
  getPayPalConfig,
  postCapturePayPalOrder,
  postCreatePayPalOrder,
} from "../controllers/paypal.controller.js";

const paypalRouter = Router();

paypalRouter.get("/config", getPayPalConfig);
paypalRouter.post("/create-order", requireAuth, postCreatePayPalOrder);
paypalRouter.post("/capture", requireAuth, postCapturePayPalOrder);

export { paypalRouter };

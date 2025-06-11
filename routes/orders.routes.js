import { Router } from "express";
import verifyUser from "../middleware/verifyUser.js";
import { makeOrder } from "../controllers/orders.controllers.js";

const router = Router();

router.route("/").post(verifyUser, makeOrder);

export default router;
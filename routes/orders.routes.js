import { Router } from "express";
import verifyUser from "../middleware/verifyUser.js";
import { makeOrder, getOrdersByUser } from "../controllers/orders.controllers.js";

const router = Router();

router.route("/").post(verifyUser, makeOrder);
router.route("/user").get(verifyUser, getOrdersByUser)

export default router;
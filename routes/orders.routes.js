import { Router } from "express";
import verifyUser from "../middleware/verifyUser.js";
import { makeOrder, getOrdersByUser, modifyOrderDetails } from "../controllers/orders.controllers.js";

const router = Router();

router.route("/").post(verifyUser, makeOrder)
router.route("/:orderId").patch(verifyUser, modifyOrderDetails) //verify req.user.isAdmin is true
router.route("/user").get(verifyUser, getOrdersByUser)

export default router;
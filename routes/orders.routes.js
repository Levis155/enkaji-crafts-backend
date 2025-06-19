import { Router } from "express";
import verifyUser from "../middleware/verifyUser.js";
import { generateAccessToken } from "../middleware/generateAccessToken.js";
import {
  payAndPlaceOrder,
  getOrdersByUser,
  modifyOrderDetails,
  updatePaymentStatus,
  receivePaymentStatus,
} from "../controllers/orders.controllers.js";

const router = Router();

router.route("/").post([verifyUser, generateAccessToken], payAndPlaceOrder);
router.route("/callback").post(updatePaymentStatus);
router.route("/payment-status/:checkoutRequestId").get(receivePaymentStatus)
router.route("/:orderId").patch(verifyUser, modifyOrderDetails); //verify req.user.isAdmin is true
router.route("/user").get(verifyUser, getOrdersByUser);

export default router;

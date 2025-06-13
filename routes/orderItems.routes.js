import { Router } from "express";
import { updateOrderItem } from "../controllers/orderItems.controllers.js";
import verifyUser from "../middleware/verifyUser.js";

const router = Router();

router.route("/:orderItemId").patch(verifyUser, updateOrderItem)

export default router;
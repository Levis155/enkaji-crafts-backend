import { Router } from "express";
import { addToCart, incrementItemQuantity, decrementItemQuantity } from "../controllers/cart.controllers.js";

const router = Router();

router.route("/:productId").post(addToCart);
router.route("/items/:cartId/increment").patch(incrementItemQuantity)
router.route("/items/:cartId/decrement").patch(decrementItemQuantity)

export default router;
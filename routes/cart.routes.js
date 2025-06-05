import { Router } from "express";
import { addToCart } from "../controllers/cart.controllers.js";

const router = Router();

router.route("/").post(addToCart);

export default router;
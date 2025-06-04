import { Router } from "express";
import { createProduct } from "../controllers/products.controllers.js";

const router = Router();

router.route("/").post(createProduct);

export default router;
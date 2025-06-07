import { Router } from "express";
import { createProduct, getAllProducts, getProduct } from "../controllers/products.controllers.js";

const router = Router();

router.route("/").post(createProduct).get(getAllProducts);
router.route("/:id").get(getProduct);

export default router;
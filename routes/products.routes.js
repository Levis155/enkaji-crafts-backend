import { Router } from "express";
import { createProduct, getAllProducts, getProduct, getSimilarProducts } from "../controllers/products.controllers.js";

const router = Router();

router.route("/").post(createProduct).get(getAllProducts);
router.route("/:id").get(getProduct);
router.route("/category/:category").get(getSimilarProducts);

export default router;
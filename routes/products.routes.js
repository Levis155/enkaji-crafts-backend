import { Router } from "express";
import { createProduct, getAllProducts, getProduct, getSimilarProducts, getSearchedProducts } from "../controllers/products.controllers.js";

const router = Router();

router.route("/").post(createProduct).get(getAllProducts);
router.route("/:id").get(getProduct);
router.route("/category/:category").get(getSimilarProducts);
router.route("/search/:query").get(getSearchedProducts);

export default router;
import { Router } from "express";
import { addReview } from "../controllers/reviews.controllers.js";
import verifyUser from "../middleware/verifyUser.js";

const router = Router();

router.route("/").post(verifyUser, addReview);

export default router;
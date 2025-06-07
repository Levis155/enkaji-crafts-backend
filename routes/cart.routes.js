import { Router } from "express";
import {
getItems,
addItems
} from "../controllers/cart.controllers.js";
import verifyUser from "../middleware/verifyUser.js";

const router = Router();

router.route("/items").post(verifyUser, addItems).get(verifyUser, getItems)



export default router;

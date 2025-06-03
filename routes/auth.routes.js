import {Router} from "express";
import { register } from "../controllers/auth.controllers.js";
import validateEmail from "../middleware/validateEmail.js";


const router = Router();

router.route("/register").post(validateEmail, register)

export default router;
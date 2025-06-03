import {Router} from "express";
import { register, login } from "../controllers/auth.controllers.js";
import validateEmail from "../middleware/validateEmail.js";


const router = Router();

router.route("/register").post(validateEmail, register);
router.route("/login").post(login)

export default router;
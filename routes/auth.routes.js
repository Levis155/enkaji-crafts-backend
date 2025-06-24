import {Router} from "express";
import { register, login, googleLogin } from "../controllers/auth.controllers.js";
import validateEmail from "../middleware/validateEmail.js";


const router = Router();

router.route("/register").post(validateEmail, register);
router.route("/login").post(login)
router.route("/google").post(googleLogin);

export default router;
import {Router} from "express";
import { register, login, googleLogin, forgotPassword, resetPassword } from "../controllers/auth.controllers.js";
import validateEmail from "../middleware/validateEmail.js";
import checkPasswordStrength from "../middleware/checkPasswordStrength.js";


const router = Router();

router.route("/register").post([validateEmail,  checkPasswordStrength], register);
router.route("/login").post(login)
router.route("/google").post(googleLogin);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").post(checkPasswordStrength, resetPassword);

export default router;
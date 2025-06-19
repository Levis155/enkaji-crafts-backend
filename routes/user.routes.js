import { Router } from "express";
import verifyUser from "../middleware/verifyUser.js";
import { updateUserProfile, setUserToAdmin } from "../controllers/user.controllers.js";

const router = Router();

router.route("/").patch(verifyUser, updateUserProfile)


export default router;
import { Router } from "express";
import { signup, signin } from "../controllers/user.controller.js";

const router:Router = Router();

router.route("/signup").post(signup);
router.route("/login").post(signin);

export default router;
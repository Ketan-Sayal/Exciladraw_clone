import { Router } from "express";
import { createRoom, getRoomShapes } from "../controllers/room.controller.js";
import { isLoggedin } from "../middlewares/auth.middleware.js";

const router:Router = Router();

router.route("/create").post(isLoggedin, createRoom);
router.route("/data/shapes/:id").get(isLoggedin, getRoomShapes);

export default router;
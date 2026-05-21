import express, {type Express} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app:Express = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import roomRouter from "./routes/room.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/rooms", roomRouter);

export {app};
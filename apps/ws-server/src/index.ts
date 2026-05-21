import express from 'express';
import * as dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import {prisma} from "@workspace/db/client";
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from "cors";

dotenv.config();

const requiredEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const parsePort = (value: string | undefined, fallback: number) => {
    const port = Number(value ?? fallback);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value: ${value}`);
    }
    return port;
};

const PORT = parsePort(process.env.PORT, 8081);
const JWT_SECRET = requiredEnv("JWT_SECRET");
requiredEnv("DATABASE_URL");

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // your Next.js frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

interface IUser{
    socketId:string;
}

const users:IUser[] = [];

io.use((socket, next)=>{
        try {
            const token = socket.handshake.query.token as string;
        if(!token){
            throw new Error("Token is required")
        }
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if(!decoded||!decoded.id){
            throw new Error("Unauthorized user");
        }
        socket.data.id = decoded.id;
        next();
    } catch (error) {
        next(new Error("Invalid user credentials"));
    }
})

io.on('connection', (socket) => {
    
    socket.on("join_room", (data)=>{
        const roomId = data.roomId;
        const socketId = socket.id;
        let user = users.find((user:IUser)=>user.socketId===socketId);
        const stringRoomId = String(roomId);
        socket.join(stringRoomId);
        user = {
            socketId,
        }
        users.push(user);
        socket.to(stringRoomId).emit("new_user", {user});
    });

    socket.on("message", async(data)=>{
        const userId = socket.data.id;
        const message = data.message;
        const socketId = socket.id;
        const roomId = data.roomId;
        const stringRoomId = String(roomId);
        const user = users.find((user:IUser)=>user.socketId===socketId);
        socket.to(stringRoomId).emit("new_message", {message, user});
        const parsedMessage = JSON.parse(message) as { id?: string };
        await prisma.shape.create({
            data:{
                id: parsedMessage.id,
                shapeData:message,
                userId,
                roomId:Number(roomId)
            }
        });
    });

    socket.on("delete_shape", async(data)=>{
        const shapeId = data.shapeId;
        const roomId = Number(data.roomId);
        if(!shapeId || !roomId){
            return;
        }
        const stringRoomId = String(roomId);
        socket.to(stringRoomId).emit("delete_shape", {shapeId});
        await prisma.shape.deleteMany({
            where:{
                id:shapeId,
                roomId
            }
        });
    });

    socket.on("disconnect", () => {
        const index = users.findIndex((user) => user.socketId === socket.id);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });
});

server.listen(PORT, () => {
  console.log(`Websocket server running at http://localhost:${PORT}`);
});

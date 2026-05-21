import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { NextFunction, Request, Response } from "express";
import { getRoomShapes as roomShapes, create } from "../services/room.service.js";
import { getUserById } from "../services/user.service.js";

export const getRoomShapes = asyncHandler(async(req:Request, res:Response, _:NextFunction)=>{
    const roomId = req.params.id;
    if(!roomId){
        throw new ApiError(403, "Invalid room id");
    }
    const intRoomId = parseInt(roomId as string);
    const existingRoom = await roomShapes(intRoomId);
    if(!existingRoom){
        throw new ApiError(404, "Room not found");
    }
    return res.status(200).json(new ApiResponse(200, {room:existingRoom}, "Shapes of room sent successfully"));
});

export const createRoom = asyncHandler(async(req:Request, res:Response, _:NextFunction)=>{
    const userId = req.userId;
    const user = await getUserById(userId);
    if(!user){
        throw new ApiError(403, "Invalid user");
    }
    const room = await create(userId);
    return res.status(200).json(new ApiResponse(200, {room}, "Room created successfully"));
});
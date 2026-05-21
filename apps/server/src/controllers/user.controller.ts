import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { create, getUserByEmail } from "../services/user.service.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { SigninSchema, SignupSchema } from "../utils/validation.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { config } from "../config.js";

export const signup = asyncHandler(async(req:Request, res:Response, _:NextFunction)=>{
        const {username, email, password} = req.body;
        const {success} = SignupSchema.safeParse({username, email, password});
        
        if(!success){
            throw new ApiError(400, "Invalid credentials");
        }
        const existingUser = await getUserByEmail(email);
        if(existingUser){
            throw new ApiError(409, "User already exists");
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await create(username, email, hash);
        const token = jwt.sign({id:user.id}, config.jwt_secret);
        return res.status(201).cookie("token", token).json(new ApiResponse(201, {user, token}, "User created successfully"));
    
});

export const signin = asyncHandler(async(req:Request, res:Response, _:NextFunction)=>{
        const {email, password} = req.body;
        const {success} = SigninSchema.safeParse({email, password});
        if(!success){
            throw new ApiError(400, "Invalid credentials");
        }
        const existingUser = await getUserByEmail(email);
        if(!existingUser){
            throw new ApiError(404, "User does not exist. Please sign up first.");
        }
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordCorrect){
            throw new ApiError(401, "Incorrect password");
        }
        const token = jwt.sign({id:existingUser.id}, config.jwt_secret);
        return res.status(200).cookie("token", token).json(new ApiResponse(200, {user:{
            id:existingUser.id,
            email:existingUser.email,
            username:existingUser.username
        }, token}, "User logged in successfully"));
    
});

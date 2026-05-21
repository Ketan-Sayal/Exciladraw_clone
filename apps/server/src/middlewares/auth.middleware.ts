import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config.js";

export const isLoggedin = async(req:Request, res:Response, next:NextFunction)=>{
    try {
        const token = req.headers.authorization || req.cookies.token;
        
        if(!token){
            throw new ApiError(404, "User must login");
        }
        const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;
        req.userId = decoded.id;
        next();
    } catch (error) {
        if(error instanceof ApiError){
            return res.status(error.statusCode).json(new ApiError(error.statusCode, error.message));
        }else if(error instanceof Error){
            return res.status(500).json(new ApiError(500, error.message));
        }
        return res.status(403).json(new ApiError(403, "Unauthorized user"));
    }
}
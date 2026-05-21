import { NextFunction, Request, Response } from "express"
import { ApiError } from "./ApiError.js";

export const asyncHandler = (fn:(req:Request, res:Response, next:NextFunction)=>Promise<Response | void>)=>{
    return async(req:Request, res:Response, next:NextFunction)=>{
        try {
            return await fn(req, res, next);
        } catch (error) {
            if(error instanceof ApiError){
                return res.status(error.statusCode).json(new ApiError(error.statusCode, error.message));
            }else if(error instanceof Error){
                return res.status(500).json(new ApiError(500, error.message));
            }
            return res.status(500).json(new ApiError(500, "Something went wrong"));
        }
    }
}
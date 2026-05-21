"use server";
import axios from "axios";
import { cookies } from 'next/headers'
import { config } from "./config";
import { revalidatePath } from "next/cache";

type FormState = {
  success: boolean;
  fields?: Record<string, string>;
  error?: string;
}

const getAuthErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (typeof message === "string") {
            return message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
}

export const signin = async(prevState: FormState, payload: FormData)=>{
    try {
        const email = payload.get("email");
        const password = payload.get("password");
        if(!email || !password){
            return {
                success:false,
                error:"All fields are required"
            }
        }
        
        const res = await axios.post(`${config.backendUrl}/api/v1/users/login`, {email, password});
        const token = res.data.data.token;
        const cookieStore = await cookies();
        cookieStore.set("auth-canavas-sketch-board-token", token);
        revalidatePath("/");
        return {
            success:true
        }
    } catch (error) {
        return {
            success:false,
            error:getAuthErrorMessage(error)
        }
    }
}

export const signup = async(prevState: FormState, payload: FormData)=>{
    try {
        const email = payload.get("email");
        const password = payload.get("password");
        const username = payload.get("username");
        if(!email || !password || !username){
            return {
                success:false,
                error:"All fields are required"
            }
        }
        const res = await axios.post(`${config.backendUrl}/api/v1/users/signup`, {email, password, username});
        const token = res.data.data.token;
        const cookieStore = await cookies();
        cookieStore.set("auth-canavas-sketch-board-token", token);
        revalidatePath("/");
        return {
            success:true
        }
    } catch (error) {
        return {
            success:false,
            error:getAuthErrorMessage(error)
        }
    }
}

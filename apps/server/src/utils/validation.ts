import {z} from "zod";

export const SignupSchema = z.object({
    username:z.string().min(1),
    email: z.string().email().min(1),
    password:z.string().min(1),
});

export const SigninSchema = z.object({
    email:z.string().email().min(1),
    password: z.string().min(1)
});
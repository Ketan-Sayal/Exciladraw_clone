import {prisma} from "@workspace/db/client";

export const create = async(username:string, email:string, password:string)=>{
    try {
        const res = await prisma.user.create({
            data:{
                username:username,
                email,
                password
            },
            select:{
                username:true,
                email:true,
                id:true
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getUserById = async(id:number)=>{
    try {
        const res = await prisma.user.findFirst({
            where:{
                id
            },
            select:{
                shapes:true,
                email:true,
                username:true,
                rooms:true
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getUserByEmail = async(email:string)=>{
    try {
        const res = await prisma.user.findFirst({
            where:{
                email
            },
            select:{
                shapes:true,
                email:true,
                username:true,
                password:true,
                id:true
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return  null;
    }
}
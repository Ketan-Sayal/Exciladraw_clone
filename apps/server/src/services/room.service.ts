import {prisma} from "@workspace/db/client";

export const create = async(userId:number)=>{
    try {
        const res = await prisma.room.create({
            data:{
                userId
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getRoomById = async(roomId:number)=>{
    try {
        const res = await prisma.room.findFirst({
            where:{
                id:roomId
            },
            select:{
                id:true,
                user:true,
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const getRoomShapes = async(roomId:number)=>{
    try {
        const res = await prisma.room.findFirst({
            where:{
                id:roomId
            },
            select:{
                shapes:true,
                id:true,
                user:true,
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        return null;
    }
}
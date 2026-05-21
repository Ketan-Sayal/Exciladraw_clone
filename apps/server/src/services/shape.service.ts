import {prisma} from "@workspace/db/client";

export const makeShape = async(shape:string, userId:number, roomId:number)=>{
    try {
        const res = await prisma.shape.create({
            data:{
                shapeData:shape,
                userId,
                roomId,
            },
            select:{
                user:true,
                id:true,
                shapeData:true
            }
        });
        return res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}
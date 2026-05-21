import CanvasRoom from "@/components/CanvasRoom";
import { config } from "@/lib/config";
import { getSocket } from "@/lib/socket";
import { getToken } from "@/lib/utils";
import axios from "axios";
import { notFound } from "next/navigation";

const CanvasPage = async({params}:{
    params:Promise<{
        roomId:string
    }>
}) => {
    const {roomId} = await params;
    const token = await getToken();
    try {
      const res = await axios.get(`${config.backendUrl}/api/v1/rooms/data/shapes/${roomId}`, {headers:{
        Authorization: token
      }});
      const room = res.data.data.room;
      if(!room){
        notFound();
      }
    } catch (error) {
      notFound();
    }
  return (
    <CanvasRoom roomId={roomId || ""} token={token || ""}/>
  )
}

export default CanvasPage;

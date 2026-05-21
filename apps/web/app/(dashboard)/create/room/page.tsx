import CreateRoom from "@/components/CreateRoom"
import { getToken } from "@/lib/utils"

const page = async() => {
    const token = await getToken();
  return (
    <CreateRoom token={token || ""}/>
  )
}

export default page

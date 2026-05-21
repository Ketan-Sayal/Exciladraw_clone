import { getToken } from "@/lib/utils"
import { redirect } from "next/navigation";
import { ReactNode } from "react"

const Layout = async({children}:{children:ReactNode}) => {
  const token = await getToken();
  if(!token)redirect("/");
  
    return (
    <div className="w-full h-full">
        {children}
    </div>
  )
}

export default Layout

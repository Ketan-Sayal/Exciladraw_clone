"use client";
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation";

const NavButton = ({url, text, varient="default"}:{url:string; text:string; varient?:"ghost"| "default"}) => {
    const router = useRouter();
  return (
    <Button variant={varient}
    onClick={()=>{
        router.push(url);
    }}
    >{text}</Button>
  )
}

export default NavButton;

"use client";

import { useEffect, useState } from "react";
import { type Socket } from "socket.io-client";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Canvas from "./Canvas";

const CanvasRoom = ({ roomId, token }: { roomId: string; token: string }) => {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [shape, setShape] = useState("rect");
  const [keyboardDrawMode, setKeyboardDrawMode] = useState(false);

  useEffect(() => {
    const socket = getSocket(token);
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.emit("join_room", { roomId });
    }
  }, [roomId, socket]);

  return (
    <div className="relative h-screen w-screen bg-background">
      <div className="absolute left-4 top-4 z-10">
        <Button variant="outline" onClick={() => router.push("/")}>
          Home
        </Button>
      </div>

      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2 rounded-lg border bg-card px-3 py-2 shadow">
        <Button
          onClick={() => setShape("pencil")}
          variant={shape === "pencil" ? "default" : "secondary"}
        >
          Pencil
        </Button>

        <Button
          onClick={() => setShape("rect")}
          variant={shape === "rect" ? "default" : "secondary"}
        >
          Rectangle
        </Button>

        <Button
          onClick={() => setShape("circle")}
          variant={shape === "circle" ? "default" : "secondary"}
        >
          Circle
        </Button>

        <Button
          onClick={() => setKeyboardDrawMode((enabled) => !enabled)}
          variant={keyboardDrawMode ? "default" : "outline"}
        >
          Keyboard Draw Mode
        </Button>
      </div>

      <div className="absolute right-4 top-4 z-10">
        <div className="rounded-lg border bg-card px-4 py-2 text-sm shadow">
          Room ID: <span className="font-semibold">{roomId}</span>
        </div>
      </div>

      <Canvas
        socket={socket}
        roomId={roomId}
        isConnected={connected}
        currShape={shape}
        token={token}
        keyboardDrawMode={keyboardDrawMode}
      />
    </div>
  );
};

export default CanvasRoom;

"use client";

import { drawShapes } from "@/lib/draw";
import { useEffect, useRef } from "react";
import { type Socket } from "socket.io-client";

const Canvas = ({
  socket,
  isConnected,
  roomId,
  currShape,
  token,
  keyboardDrawMode,
}: {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string;
  currShape: string;
  token: string;
  keyboardDrawMode: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (keyboardDrawMode) {
      canvasRef.current?.focus();
    }
  }, [keyboardDrawMode]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let isMounted = true;

    if (socket && isConnected && canvasRef.current) {
      (async () => {
        const fn = await drawShapes(
          canvasRef.current!,
          currShape,
          socket,
          roomId,
          token,
          keyboardDrawMode,
        );

        if (isMounted && fn) {
          cleanup = fn;
        }
      })();
    }

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [socket, isConnected, currShape, roomId, token, keyboardDrawMode]);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      className="h-full w-full outline-none"
      aria-label="Whiteboard canvas"
      onMouseDown={() => canvasRef.current?.focus()}
    />
  );
};

export default Canvas;

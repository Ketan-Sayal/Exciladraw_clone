"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { config } from "@/lib/config";

export default function JoinRoomPage({token}:{token:string}) {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setLoading(true);
    try {
      if (!roomId) return;
      const res = await axios.get(`${config.backendUrl}/api/v1/rooms/data/shapes/${roomId}`, {headers:{
        Authorization: token
      }});
      router.push(`/canvas/${res.data.data.room.id}`);
    } catch (error) {
      console.log(error);
      setError("Invalid room id");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      
      <Card className="w-full max-w-md shadow-lg border">
        
        <CardHeader>
          <CardTitle className="text-2xl">Join a Room</CardTitle>
          <CardDescription>
            Enter your details to join a collaborative sketch room.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Room ID */}
          <div className="space-y-2">
            <Label htmlFor="room">Room ID</Label>
            <Input
              onChange={(e) => {
                setRoomId(e.target.value);
                setError(""); // clears error on typing
              }}
              id="room"
              placeholder="Enter room code"
            />
          </div>

          {/* ❗ Error Message */}
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Join Button */}
          <Button
            onClick={join}
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Room"}
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
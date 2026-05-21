"use client";

import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { config } from "@/lib/config";
import { useRouter } from "next/navigation";

const CreateRoom = ({ token }: { token: string }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const create = async () => {
    setLoading(true);
    setError("");

    try {
        console.log("backend url:", config.backendUrl);
        
      const res = await axios.post(
        `${config.backendUrl}/api/v1/rooms/create`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const roomId = res.data.data.room.id;
      router.push(`/canvas/${roomId}`);
    } catch (error) {
      console.log(error);
      setError("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      
      <Card className="w-full max-w-md shadow-lg border">
        
        <CardHeader>
          <CardTitle className="text-2xl">Create Room</CardTitle>
          <CardDescription>
            Start a new collaborative sketch room
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* ❗ Error Message */}
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Button */}
          <Button
            onClick={create}
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Room"}
          </Button>

        </CardContent>
      </Card>

    </div>
  );
};

export default CreateRoom;
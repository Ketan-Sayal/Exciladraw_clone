"use client";

import { signin } from "@/lib/actions";
import { useActionState, useEffect } from "react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { useRouter } from "next/navigation";

const Signin = () => {
  const [state, action, isPending] = useActionState(signin, {
    success: false,
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/");
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      
      <Card className="w-full max-w-md shadow-lg border">
        
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Input
              type="email"
              name="email"
              placeholder="john@gmail.com"
              required
            />

            <Input
              type="password"
              name="password"
              placeholder="password123"
              required
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* 👇 Added section */}
          <p className="text-sm text-center text-muted-foreground mt-4">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/signup")}
              className="underline cursor-pointer text-primary"
            >
              Sign up
            </span>
          </p>

        </CardContent>

      </Card>
    </div>
  );
};

export default Signin;
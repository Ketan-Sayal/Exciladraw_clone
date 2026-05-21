import { getToken } from '@/lib/utils'
import React from 'react'
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import NavButton from '@/components/NavButton';


const Landing = async() => {
  const token = await getToken();
  console.log(token);
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* NAVBAR */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold tracking-tight">SketchBoard</h1>
        <div className="flex gap-3">
          {
            !token?(<>
            <NavButton text="Login" url="/signin" varient={"ghost"}/>
          <NavButton text="Signup" url="/signup"/>
            </>):(<>
          <NavButton text="Join Room" varient='ghost' url="/join/room"/>
          <NavButton text="Create Room" url="/create/room"/>
            </>)
          }
        </div>
      </header>

      {/* HERO */}
      <section className="text-center py-20 px-6">
        <Badge className="mb-4">🚀 New: Real-time collaboration</Badge>

        <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
          Draw. Collaborate. <br /> Build Ideas Visually.
        </h2>

        <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
          SketchBoard is a powerful online whiteboard for brainstorming,
          designing, and collaborating in real-time with your team.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg">Start Drawing</Button>
          <Button size="lg" variant="outline">
            Live Demo
          </Button>
        </div>

        {/* Mock canvas preview */}
        <div className="mt-16 mx-auto max-w-4xl rounded-xl border bg-muted p-4 shadow-lg">
          <div className="h-[300px] rounded-lg bg-background flex items-center justify-center text-muted-foreground">
            Canvas Preview (Your App Here)
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 bg-muted/40">
        <h3 className="text-3xl font-bold text-center mb-12">
          Why SketchBoard?
        </h3>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-2">
                ✏️ Smooth Drawing
              </h4>
              <p className="text-muted-foreground">
                Experience lag-free drawing with intuitive tools and precision.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-2">
                🤝 Real-time Collaboration
              </h4>
              <p className="text-muted-foreground">
                Work together with your team live, no refresh needed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-2">
                ☁️ Cloud Sync
              </h4>
              <p className="text-muted-foreground">
                Your sketches are saved securely and accessible anywhere.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h3 className="text-3xl md:text-4xl font-bold">
          Start creating today
        </h3>

        <p className="mt-4 text-muted-foreground">
          Join thousands of creators using SketchBoard.
        </p>

        <Button size="lg" className="mt-6">
          Get Started for Free
        </Button>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SketchBoard. All rights reserved.
      </footer>
    </div>
  )
}

export default Landing

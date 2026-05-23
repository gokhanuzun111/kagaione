import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useCreateGameSession, useListGameSessions, getListGameSessionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameSessionInputPaceMode } from "@workspace/api-client-react/src/generated/api.schemas";

const SCENARIOS = [
  { id: "founder", title: "Founder", desc: "Your AI company is running out of time. The board is silent. Midnight approaches.", pace: "hourly", intensity: 9 },
  { id: "elite-circle", title: "Elite Circle", desc: "You enter a private world of money, influence and secrets. No one is who they claim to be.", pace: "daily", intensity: 8, premium: true },
  { id: "parallel-life", title: "Parallel Life", desc: "You live a completely different adult life. New name, new world, new choices.", pace: "long", intensity: 6 },
  { id: "crisis-room", title: "Crisis Room", desc: "A company, family or public reputation crisis unfolds in real time. Every decision matters.", pace: "hourly", intensity: 8 },
  { id: "long-simulation", title: "Long Simulation", desc: "A slow life simulation that evolves over weeks. Patience is power.", pace: "long", intensity: 4 },
  { id: "custom", title: "Custom Scenario", desc: "Write your own premise. You define the world, the stakes, the identity.", pace: "daily", intensity: 5, premium: true },
];

export default function Scenarios() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createSession = useCreateGameSession();
  const { data: sessions, isLoading } = useListGameSessions();

  const handleStart = (scenario: typeof SCENARIOS[0]) => {
    createSession.mutate({
      data: {
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        paceMode: scenario.pace as GameSessionInputPaceMode,
      }
    }, {
      onSuccess: (session) => {
        queryClient.invalidateQueries({ queryKey: getListGameSessionsQueryKey() });
        setLocation(`/game/${session.id}`);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="scanline"></div>
      
      <header className="p-6 flex justify-between items-center border-b border-white/5 z-10 bg-background/80 backdrop-blur-md">
        <div className="text-xl font-bold tracking-widest text-primary glow-text">KAGAIONE</div>
        <div className="flex gap-4">
          <Link href="/pricing">
            <Button variant="ghost" className="text-primary">Upgrade</Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="border-white/10">Settings</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 lg:p-12 z-10 flex gap-8">
        <div className="flex-1 max-w-5xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-light tracking-wide mb-2">Select Scenario</h1>
              <p className="text-muted-foreground text-sm">Choose a world to enter. Your choices will be permanent.</p>
            </div>
            {sessions && sessions.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Active Sessions</p>
                <div className="flex gap-2">
                  {sessions.map(s => (
                    <Button key={s.id} variant="outline" size="sm" onClick={() => setLocation(`/game/${s.id}`)} className="border-white/10 bg-white/5">
                      Continue {s.scenarioTitle}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCENARIOS.map(s => (
              <div key={s.id} className="border border-white/8 bg-card p-6 hover:border-primary/40 transition-all duration-300 flex flex-col group relative overflow-hidden shimmer-border">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 blur-[50px] group-hover:bg-primary/20 transition-all"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h2 className="text-xl font-medium tracking-wide text-white">{s.title}</h2>
                  {s.premium && (
                    <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/30 px-2 py-1 bg-primary/10">
                      Premium
                    </span>
                  )}
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1 relative z-10">
                  {s.desc}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="uppercase tracking-widest">Pace: {s.pace}</span>
                    <span className="uppercase tracking-widest">Int: {s.intensity}/10</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-primary hover:bg-transparent px-0 uppercase tracking-widest text-sm font-bold"
                    onClick={() => handleStart(s)}
                    disabled={createSession.isPending}
                  >
                    Enter →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

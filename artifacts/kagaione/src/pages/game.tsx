import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetGameSession, getGetGameSessionQueryKey, useListGameMessages, getListGameMessagesQueryKey, useGetWorldFeed } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GameMessage } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Game({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const numId = parseInt(sessionId, 10);
  const { data: session, isLoading: sessionLoading } = useGetGameSession(numId, { query: { enabled: !!numId, queryKey: getGetGameSessionQueryKey(numId) } });
  const { data: messages, isLoading: messagesLoading } = useListGameMessages(numId, { query: { enabled: !!numId, queryKey: getListGameMessagesQueryKey(numId) } });
  const { data: worldFeed } = useGetWorldFeed();

  const [customAction, setCustomAction] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [streamedChoices, setStreamedChoices] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamedContent]);

  const handleAction = async (action: string) => {
    if (!action.trim() || isStreaming) return;
    
    setIsStreaming(true);
    setStreamedContent("");
    setStreamedChoices([]);
    setCustomAction("");

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      sessionId: numId,
      role: "player",
      content: action,
      createdAt: new Date().toISOString()
    } as GameMessage;
    
    queryClient.setQueryData(getListGameMessagesQueryKey(numId), (old: any) => 
      old ? [...old, tempUserMsg] : [tempUserMsg]
    );

    try {
      const res = await fetch(`/api/game/sessions/${numId}/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAction: action })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim().startsWith('data: '));
        
        for (const line of lines) {
          const jsonStr = line.replace(/^data: /, '').trim();
          if (!jsonStr) continue;
          
          try {
            const data = JSON.parse(jsonStr);
            if (data.content) {
              setStreamedContent(prev => prev + data.content);
            }
            if (data.done) {
              if (data.choices) setStreamedChoices(data.choices);
            }
          } catch (e) {}
        }
      }
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getListGameMessagesQueryKey(numId) });
      queryClient.invalidateQueries({ queryKey: getGetGameSessionQueryKey(numId) });
    }
  };

  if (sessionLoading || messagesLoading) {
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center text-primary tracking-widest uppercase">Initializing...</div>;
  }

  const latestChoices = isStreaming ? [] : (messages && messages.length > 0) ? (() => {
    const last = messages[messages.length - 1];
    if (last.role === 'narrator' && last.choices) {
      try { return JSON.parse(last.choices); } catch(e) { return []; }
    }
    return [];
  })() : [];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 ambient-gradient opacity-50"></div>
      
      <header className="p-4 border-b border-white/5 flex justify-between items-center z-10 bg-background/90 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link href="/scenarios" className="text-muted-foreground hover:text-white transition-colors text-sm uppercase tracking-widest">← Back</Link>
          <div className="text-sm font-medium tracking-widest text-primary">{session?.scenarioTitle}</div>
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-4">
          <span>{session?.paceMode} Pace</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden z-10">
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-12 scroll-smooth">
            <div className="flex flex-col gap-8 pb-32">
              {messages?.map((msg) => (
                <div key={msg.id} className={`max-w-2xl ${msg.role === 'player' ? 'ml-auto text-right text-muted-foreground' : 'mr-auto text-white'}`}>
                  <p className={`text-lg leading-relaxed ${msg.role === 'narrator' ? 'font-serif' : 'font-sans opacity-70'}`}>
                    {msg.content}
                  </p>
                </div>
              ))}
              
              {isStreaming && (
                <div className="max-w-2xl mr-auto text-white">
                  <p className="text-lg leading-relaxed font-serif">
                    {streamedContent}<span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse"></span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {!isStreaming && (latestChoices.length > 0 || streamedChoices.length > 0) && (
                <div className="flex flex-col gap-2">
                  {(streamedChoices.length > 0 ? streamedChoices : latestChoices).map((choice: string, idx: number) => (
                    <Button 
                      key={idx}
                      variant="outline" 
                      className="justify-start border-white/10 bg-black/50 hover:bg-white/10 hover:border-primary/50 text-left h-auto py-3 px-4 font-serif text-base rounded-none transition-all"
                      onClick={() => handleAction(choice)}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 items-center">
                <Input 
                  placeholder="Or type a custom action..." 
                  className="bg-black/50 border-white/10 rounded-none focus-visible:ring-primary h-12 text-base font-serif"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAction(customAction)}
                  disabled={isStreaming}
                />
                <Button 
                  onClick={() => handleAction(customAction)}
                  disabled={!customAction.trim() || isStreaming}
                  className="bg-primary text-primary-foreground rounded-none h-12 px-6 tracking-widest uppercase text-xs hover:bg-primary/90"
                >
                  Act
                </Button>
              </div>
            </div>
          </div>
        </main>

        <aside className="w-64 border-l border-white/5 bg-[#0a0a0a]/80 backdrop-blur hidden lg:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Metrics</h3>
            {session?.stats && (
              <div className="flex flex-col gap-4">
                {Object.entries(session.stats).map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="uppercase text-gray-400">{key}</span>
                      <span className="text-primary font-mono">{val}%</span>
                    </div>
                    <div className="h-1 bg-white/10 w-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">World Feed</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {worldFeed && worldFeed.length > 0 ? worldFeed.map(feed => (
                <div key={feed.id} className="text-xs">
                  <span className="font-mono text-primary mr-2 opacity-80">{feed.username}</span>
                  <span className="text-gray-400">{feed.eventText}</span>
                </div>
              )) : (
                <div className="text-xs text-gray-500 italic">Listening for echoes...</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="scanline"></div>
      <div className="noise-overlay"></div>
      <div className="vignette"></div>
      <div className="absolute inset-0 ambient-gradient"></div>
      
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="text-xl font-bold tracking-widest text-primary glow-text">KAGAIONE</div>
        <Link href="/sign-in">
          <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 z-10">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
          Shape a hidden world.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-12 font-light">
          A cinematic AI narrative game where your choices carry real weight. Enter a world of power, secrets, ambition and consequence — and discover who you truly are under pressure.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-none tracking-widest uppercase transition-all shadow-[0_0_25px_hsl(42_100%_58%_/_0.35)] hover:shadow-[0_0_50px_hsl(42_100%_58%_/_0.55),0_0_100px_hsl(42_100%_58%_/_0.15)]">
              Enter the Simulation
            </Button>
          </Link>
          <div className="text-xs text-muted-foreground tracking-widest border border-white/10 px-3 py-1 bg-black/50">
            18+ PSYCHOLOGICAL INTENSITY
          </div>
        </div>
      </main>
    </div>
  );
}

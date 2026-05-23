import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="scanline"></div>
      
      <header className="p-6 flex justify-between items-center border-b border-white/5 z-10">
        <Link href="/scenarios" className="text-muted-foreground hover:text-white transition-colors text-sm uppercase tracking-widest">← Back</Link>
        <div className="text-xl font-bold tracking-widest text-primary glow-text">KAGAIONE</div>
        <div className="w-16"></div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 lg:p-12 z-10 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light tracking-wide mb-4 text-white">Access Tiers</h1>
          <p className="text-muted-foreground">Select your level of immersion.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Free */}
          <div className="border border-white/10 bg-[#0a0a0a] p-8 flex flex-col">
            <h2 className="text-xl font-medium tracking-wide text-white mb-2">Standard</h2>
            <div className="text-3xl font-light mb-6">$0<span className="text-base text-muted-foreground">/mo</span></div>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground mb-8 flex-1">
              <li className="flex gap-2"><span className="text-primary">✓</span> Base scenarios</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Hourly pace only</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Standard AI generation</li>
            </ul>
            <Button variant="outline" className="w-full border-white/10 rounded-none" disabled>Current Plan</Button>
          </div>

          {/* Premium */}
          <div className="border border-primary/50 bg-primary/5 p-8 flex flex-col relative overflow-hidden transform scale-105 shadow-2xl shadow-primary/10">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-[30px]"></div>
            <h2 className="text-xl font-medium tracking-wide text-primary mb-2">Premium</h2>
            <div className="text-3xl font-light mb-6 text-white">$19<span className="text-base text-muted-foreground">/mo</span></div>
            <ul className="flex flex-col gap-4 text-sm text-gray-300 mb-8 flex-1">
              <li className="flex gap-2"><span className="text-primary">✓</span> All premium scenarios</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Custom world generation</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> All pace modes (Daily, Long)</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Extended memory context</li>
            </ul>
            <Button className="w-full bg-primary text-primary-foreground rounded-none hover:bg-primary/90">Upgrade to Premium</Button>
          </div>

          {/* Elite */}
          <div className="border border-white/10 bg-[#0a0a0a] p-8 flex flex-col">
            <h2 className="text-xl font-medium tracking-wide text-white mb-2">Elite</h2>
            <div className="text-3xl font-light mb-6 text-white">$99<span className="text-base text-muted-foreground">/mo</span></div>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground mb-8 flex-1">
              <li className="flex gap-2"><span className="text-primary">✓</span> Everything in Premium</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Unrestricted AI models</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Priority narrative generation</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Direct developer contact</li>
            </ul>
            <Button variant="outline" className="w-full border-white/10 rounded-none hover:bg-white/5 hover:text-white">Apply for Elite</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

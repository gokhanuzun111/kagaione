import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch as UISwitch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useClerk } from "@clerk/react";
import { useGetUserProfile, getGetUserProfileQueryKey, useUpdateUserProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { UserProfileUpdateMaturityLevel, UserProfileUpdateNarrativePace } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Settings() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { data: profile } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const handleUpdate = (data: any) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="scanline"></div>
      
      <header className="p-6 flex justify-between items-center border-b border-white/5 z-10">
        <Link href="/scenarios" className="text-muted-foreground hover:text-white transition-colors text-sm uppercase tracking-widest">← Back</Link>
        <div className="text-xl font-bold tracking-widest text-primary glow-text">SETTINGS</div>
        <div className="w-16"></div>
      </header>

      <main className="flex-1 overflow-auto p-6 lg:p-12 z-10 max-w-2xl mx-auto w-full">
        
        <div className="space-y-12">
          {/* Preferences */}
          <section className="space-y-6">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2">Preferences</h2>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base text-white font-medium">Ambient Sound</Label>
                <p className="text-sm text-muted-foreground">Enable atmospheric audio during scenarios.</p>
              </div>
              <UISwitch 
                checked={profile?.soundEnabled ?? false} 
                onCheckedChange={(c) => handleUpdate({ soundEnabled: c })} 
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base text-white font-medium">Maturity Intensity</Label>
                <p className="text-sm text-muted-foreground">Control the psychological intensity of the narrative.</p>
              </div>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(level => (
                  <Button 
                    key={level}
                    variant={profile?.maturityLevel === level ? "default" : "outline"}
                    className={`rounded-none uppercase tracking-widest text-xs ${profile?.maturityLevel === level ? 'bg-primary text-primary-foreground' : 'border-white/10 bg-transparent'}`}
                    onClick={() => handleUpdate({ maturityLevel: level as UserProfileUpdateMaturityLevel })}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-base text-white font-medium">Default Pace</Label>
                <p className="text-sm text-muted-foreground">How fast the world reacts to your absence.</p>
              </div>
              <div className="flex gap-2">
                {['hourly', 'daily', 'long'].map(pace => (
                  <Button 
                    key={pace}
                    variant={profile?.narrativePace === pace ? "default" : "outline"}
                    className={`rounded-none uppercase tracking-widest text-xs ${profile?.narrativePace === pace ? 'bg-primary text-primary-foreground' : 'border-white/10 bg-transparent'}`}
                    onClick={() => handleUpdate({ narrativePace: pace as UserProfileUpdateNarrativePace })}
                  >
                    {pace}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-6 pt-12">
            <h2 className="text-xs uppercase tracking-widest text-destructive border-b border-destructive/20 pb-2">Danger Zone</h2>
            
            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5">
              <div className="space-y-1">
                <Label className="text-base text-white font-medium">End All Sessions</Label>
                <p className="text-sm text-muted-foreground">Permanently delete all active scenarios.</p>
              </div>
              <Button variant="destructive" className="rounded-none uppercase tracking-widest text-xs">Purge</Button>
            </div>
            
            <div className="pt-8">
              <Button 
                variant="outline" 
                className="w-full rounded-none border-white/10 text-muted-foreground hover:text-white"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                Sign Out
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

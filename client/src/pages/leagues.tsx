import { useTeams } from "@/hooks/use-teams";
import { Link } from "wouter";
import { Trophy, ShieldAlert, Gamepad2, Upload, X, Loader2, Pencil } from "lucide-react";
import { compressLeagueImage } from "@/lib/image-utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type LeagueRecord = { id: number; userId: number; name: string; imageUrl: string | null };

function LeagueImageUpload({ leagueName, currentImage }: { leagueName: string; currentImage: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: (imageUrl: string) =>
      apiRequest("PUT", `/api/leagues/${encodeURIComponent(leagueName)}`, { imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const { dataUrl, error } = await compressLeagueImage(file);
    if (error) {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Wrong size", description: error, variant: "destructive" });
      return;
    }
    upsert.mutate(dataUrl);
  };

  const clear = () => upsert.mutate("");

  const isPending = upsert.isPending || uploading;

  return (
    <div className="flex items-center gap-1.5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {currentImage ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            title="Change logo"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            onClick={clear}
            disabled={isPending}
            title="Remove logo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Add logo
          <span className="text-muted-foreground/60 font-normal">(500×500)</span>
        </Button>
      )}
    </div>
  );
}

export default function Leagues() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data: teams, isLoading: teamsLoading } = useTeams({ enabled: isAdmin });
  const { data: leagueImages, isLoading: leaguesLoading } = useQuery<LeagueRecord[]>({
    queryKey: ["/api/leagues"],
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/");
  }, [authLoading, isAdmin]);

  const isLoading = authLoading || teamsLoading || leaguesLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
        <Skeleton className="h-12 w-48 mb-3" />
        <Skeleton className="h-5 w-72 mb-10" />
        {[1, 2].map(i => (
          <div key={i} className="mb-10">
            <Skeleton className="h-7 w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-40 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Build a lookup: leagueName -> imageUrl
  const imageByLeague: Record<string, string | null> = {};
  for (const l of leagueImages ?? []) {
    if (l.imageUrl) imageByLeague[l.name] = l.imageUrl;
  }

  // Group teams by leagueName
  const grouped: Record<string, typeof teams> = {};
  for (const team of teams ?? []) {
    const key = (team as any).leagueName?.trim() || "No League";
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(team);
  }

  const leagueNames = Object.keys(grouped).sort((a, b) => {
    if (a === "No League") return 1;
    if (b === "No League") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-display tracking-wide mb-2 text-foreground">Leagues</h1>
        <p className="text-muted-foreground">Your teams organized by league.</p>
      </div>

      {leagueNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border border-dashed shadow-sm">
          <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-2xl font-bold text-display text-foreground mb-2">No Leagues Yet</h3>
          <p className="text-muted-foreground mb-2 max-w-md">
            Add teams and set a League Name to see them grouped here.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {leagueNames.map(league => {
            const leagueImg = imageByLeague[league] ?? null;
            return (
              <section key={league}>
                {/* League header */}
                <div className="flex items-center gap-3 mb-5">
                  {leagueImg ? (
                    <img
                      src={leagueImg}
                      alt={league}
                      className="h-10 w-10 rounded-lg object-cover border border-border shadow-sm shrink-0"
                    />
                  ) : (
                    <Trophy className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <h2 className="text-2xl font-bold text-display tracking-wide text-foreground">{league}</h2>
                  <Badge variant="secondary" className="ml-1 font-semibold">
                    {grouped[league]!.length} {grouped[league]!.length === 1 ? "team" : "teams"}
                  </Badge>
                  {isAdmin && league !== "No League" && (
                    <LeagueImageUpload leagueName={league} currentImage={leagueImg} />
                  )}
                  <div className="flex-1 h-px bg-border ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grouped[league]!.map(team => {
                    const winPct = team.wins + team.losses > 0
                      ? (team.wins / (team.wins + team.losses)).toFixed(3).replace(/^0+/, "")
                      : ".000";

                    return (
                      <Link key={team.id} href={`/teams/${team.id}`}>
                        <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 h-full flex flex-col">
                          <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                                  {team.conference}
                                </div>
                                <h3 className="text-xl font-bold text-display leading-tight group-hover:text-primary transition-colors truncate">
                                  {team.name}
                                </h3>
                                <p className="text-muted-foreground font-medium text-sm">{team.mascot}</p>
                                {(team as any).gameTitle && (
                                  <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                                    <Gamepad2 className="h-3 w-3 shrink-0" />
                                    {(team as any).gameTitle}
                                  </div>
                                )}
                              </div>
                              {team.logoUrl ? (
                                <div className="h-12 w-12 rounded-full bg-white border shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                  <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                                  <ShieldAlert className="h-6 w-6 opacity-50" />
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 flex-1 flex flex-col justify-end">
                            <div className="grid grid-cols-3 gap-3 text-center divide-x divide-border/50 bg-secondary/50 rounded-lg p-3">
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">W</div>
                                <div className="text-lg font-bold text-display">{team.wins}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">L</div>
                                <div className="text-lg font-bold text-display">{team.losses}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pct</div>
                                <div className="text-lg font-bold text-display">{winPct}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

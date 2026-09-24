import { useRoute, Link, useLocation } from "wouter";
import { useTeam, useDeleteTeam } from "@/hooks/use-teams";
import { ArrowLeft, UserPlus, Pencil, Trash2, Shield, MoreVertical, Trophy, Medal, ActivitySquare, Camera, Plus, ChevronLeft, ChevronRight, BarChart3, Shirt, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamForm } from "@/components/forms/team-form";
import { PlayerForm } from "@/components/forms/player-form";
import { CoachForm } from "@/components/forms/coach-form";
import { MomentForm } from "@/components/forms/moment-form";
import { SeasonRecordForm } from "@/components/forms/season-record-form";
import { DepthChartForm } from "@/components/forms/depth-chart-form";
import { PlayerAvatar } from "@/components/player-avatar";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DEPTH_CHART_POSITIONS, type DepthChartEntry, type Moment, type Player, type SeasonRecord, type TeamRecord, type TeamAward, type PersonalAward } from "@shared/schema";

function MomentCard({ moment, isAdmin, teamId }: { moment: Moment; isAdmin: boolean; teamId: number }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/moments/${moment.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "moments"] });
      toast({ title: "Moment deleted" });
    },
  });

  const date = new Date(moment.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const images = moment.images ?? [];

  return (
    <article className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {images.length > 0 && (
        <div className={`grid gap-0.5 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {images.slice(0, images.length > 4 ? 3 : images.length).map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden cursor-pointer group ${images.length === 1 ? "aspect-video" : "aspect-square"}`}
              onClick={() => setLightboxIdx(i)}
            >
              <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              {images.length > 3 && i === 2 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{images.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{date}</p>
            <h3 className="text-xl font-bold text-display text-foreground leading-tight">{moment.title}</h3>
          </div>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle className="text-display text-2xl tracking-wide">Edit Moment</DialogTitle>
                  </DialogHeader>
                  <MomentForm teamId={teamId} moment={moment} onSuccess={() => setIsEditOpen(false)} />
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this moment?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{moment.body}</p>
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={images[lightboxIdx]}
            alt=""
            className="max-h-full max-w-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function SeasonRecordRow({ record, isAdmin, teamId }: { record: SeasonRecord; isAdmin: boolean; teamId: number }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/season-records/${record.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "season-records"] });
      toast({ title: "Season record deleted" });
    },
  });

  const games = record.wins + record.losses;
  const winPercentage = games > 0 ? (record.wins / games) * 100 : 0;
  const barWidth = Math.min(100, Math.max(0, winPercentage));
  const barColor = games > 12
    ? "bg-[#D4AF37]"
    : winPercentage < 25
      ? "bg-red-500"
      : winPercentage < 50
        ? "bg-yellow-400"
        : winPercentage < 75
          ? "bg-green-500"
          : "bg-blue-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0 text-sm font-bold text-foreground">{record.season}</div>
        <div
          className="h-7 flex-1 rounded-md bg-muted/70 overflow-hidden"
          role="progressbar"
          aria-label={`${record.season} win percentage`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barWidth}
        >
          <div
            className={`h-full rounded-md ${barColor} transition-all`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="w-24 shrink-0 text-right text-sm font-semibold text-muted-foreground">
          {record.wins}-{record.losses}
          <span className="block text-xs font-normal">{Math.round(winPercentage)}%</span>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle className="text-display text-2xl tracking-wide">Edit Season Record</DialogTitle>
                </DialogHeader>
                <SeasonRecordForm teamId={teamId} record={record} onSuccess={() => setIsEditOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              aria-label={`Delete ${record.season} season record`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const DEPTH_POSITION_ALIASES: Record<string, string[]> = {
  Quarterback: ["QB", "QUARTERBACK"],
  Runningback: ["RB", "RUNNINGBACK"],
  Fullback: ["FB", "FULLBACK"],
  "Wide Receiver": ["WR", "WIDE RECEIVER"],
  "Tight End": ["TE", "TIGHT END"],
  "Offensive Tackle": ["OT", "T", "OFFENSIVE TACKLE"],
  "Offensive Guard": ["OG", "G", "OFFENSIVE GUARD"],
  Center: ["C", "CENTER"],
  "Defensive End": ["DE", "EDGE", "DEFENSIVE END"],
  "Defensive Tackle": ["DT", "DL", "DEFENSIVE TACKLE"],
  "Outside Linebacker": ["OLB", "LB", "OUTSIDE LINEBACKER"],
  "Middle Linebacker": ["MLB", "LB", "MIDDLE LINEBACKER"],
  "Corner Back": ["CB", "CORNER BACK"],
  Safety: ["S", "SS", "FS", "SAFETY"],
};

function ratingStyles(averageRating: number | null) {
  if (averageRating === null) {
    return {
      box: "bg-muted/20 border-border/70",
      badge: "bg-muted text-muted-foreground",
    };
  }
  if (averageRating > 90) {
    return {
      box: "bg-[#D4AF37]/15 border-[#D4AF37]/70",
      badge: "bg-[#D4AF37] text-[#241f0c]",
    };
  }
  if (averageRating > 85) {
    return {
      box: "bg-blue-500/10 border-blue-500/50",
      badge: "bg-blue-600 text-white",
    };
  }
  if (averageRating >= 80) {
    return {
      box: "bg-green-500/10 border-green-500/50",
      badge: "bg-green-600 text-white",
    };
  }
  if (averageRating >= 75) {
    return {
      box: "bg-yellow-400/15 border-yellow-500/60",
      badge: "bg-yellow-400 text-yellow-950",
    };
  }
  if (averageRating < 75) {
    return {
      box: "bg-red-500/10 border-red-500/50",
      badge: "bg-red-600 text-white",
    };
  }
  return {
    box: "bg-muted/20 border-border/70",
    badge: "bg-muted text-muted-foreground",
  };
}

function DepthChartYear({
  season,
  entries,
  isAdmin,
  teamId,
  players,
}: {
  season: number;
  entries: DepthChartEntry[];
  isAdmin: boolean;
  teamId: number;
  players: Player[];
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/teams/${teamId}/depth-chart/${season}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "depth-chart"] });
      toast({ title: "Roster removed" });
    },
  });

  return (
    <Card className="shadow-sm border-border/70">
      <CardHeader
  className="pb-4 border-b cursor-pointer"
  onClick={() => setIsExpanded(!isExpanded)}
>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
  <h3 className="text-xl font-bold text-display tracking-wide">{season} Roster</h3>
  <span className="text-muted-foreground text-sm">
    {isExpanded ? "▾" : "▸"}
  </span>
</div>
            <p className="text-sm text-muted-foreground">Depth order is listed top to bottom</p>
          </div>
          {isAdmin && (
            <div className="flex gap-1" onClick={event => event.stopPropagation()}>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`Edit ${season} roster`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[720px]">
                  <DialogHeader>
                    <DialogTitle className="text-display text-2xl tracking-wide">Edit {season} Roster</DialogTitle>
                  </DialogHeader>
                  <DepthChartForm teamId={teamId} season={season} entries={entries} onSuccess={() => setIsEditOpen(false)} />
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                aria-label={`Delete ${season} roster`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      {isExpanded && (
  <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          {DEPTH_CHART_POSITIONS.map(position => {
            const entriesAtPosition = entries.filter(entry => entry.position === position);
            const positionAliases = DEPTH_POSITION_ALIASES[position] || [];
            const playersAtPosition = entriesAtPosition.map(entry => ({
              entry,
              profile: players.find(player =>
                player.name.trim().toLowerCase() === entry.playerName.trim().toLowerCase() &&
                positionAliases.includes(player.position.toUpperCase()),
              ),
            }));
            const ratings = playersAtPosition
              .map(({ entry, profile }) => entry.overallRating || profile?.overallRating)
              .filter((rating): rating is number => typeof rating === "number" && rating > 0);
            const averageRating = ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
              : null;
            const styles = ratingStyles(averageRating);
            return (
              <div key={position} className={`rounded-xl border p-4 space-y-3 ${styles.box}`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{position}</h4>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${styles.badge}`}>
                    {averageRating === null ? "Avg. —" : `Avg. ${Math.round(averageRating)}`}
                  </span>
                </div>
                {entriesAtPosition.length > 0 ? (
                  <ol className="space-y-1">
                    {playersAtPosition.map(({ entry, profile }, index) => (
                      <li key={`${entry.playerName}-${index}`} className="text-sm font-medium flex items-center gap-2">
                        <span className="text-muted-foreground w-4">{index + 1}.</span>
                      <div className="min-w-0 flex-1 flex items-center gap-2">
  <span>{entry.playerName}</span>
  <img
    src={`/dev-traits/${(entry.devTrait || "Normal").toLowerCase()}dev.png`}
    alt={`${entry.devTrait || "Normal"} development trait`}
    className="h-6 w-6 shrink-0 object-contain"
  />
</div>
<span className="text-[11px] text-muted-foreground">{entry.classYear || "Senior"}</span>
                        {(entry.isRedshirted || profile?.isRedshirted) && (
                          <Shirt className="h-4 w-4 shrink-0 text-red-600 fill-red-100" aria-label="Redshirted" />
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground/60">—</p>
                )}
              </div>
            );
          })}
        </div>
            </CardContent>
    )}
    </Card>
  );
}

export default function TeamDetails() {
  const [, params] = useRoute("/teams/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();

  const { data: team, isLoading } = useTeam(id);
  const deleteTeam = useDeleteTeam();
  const { isAdmin } = useAuth();

  const queryClient = useQueryClient();
const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditCoachOpen, setIsEditCoachOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isAddTeamAwardOpen, setIsAddTeamAwardOpen] = useState(false);
  const [isAddPersonalAwardOpen, setIsAddPersonalAwardOpen] = useState(false);
  const [teamAwardType, setTeamAwardType] = useState("");
  const [teamAwardOpponent, setTeamAwardOpponent] = useState("");
  const [teamAwardScore, setTeamAwardScore] = useState("");
  const [teamAwardSeason, setTeamAwardSeason] = useState("");
  const [personalAwardPlayer, setPersonalAwardPlayer] = useState("");
  const [personalAwardName, setPersonalAwardName] = useState("");
  const [personalAwardSeason, setPersonalAwardSeason] = useState("");
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState("");
  const [recordCategory, setRecordCategory] = useState("");
  const [recordPlayer, setRecordPlayer] = useState("");
  const [recordValue, setRecordValue] = useState("");
  const [recordSeason, setRecordSeason] = useState("");
    const { data: gameRecords = [] } = useQuery<TeamRecord[]>({
    queryKey: ["/api/teams", id, "records", "Game"],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/records/Game`);
      if (!response.ok) throw new Error("Failed to fetch game records");
      return response.json();
    },
  });

    const { data: teamAwards = [] } = useQuery<TeamAward[]>({
    queryKey: ["/api/teams", id, "awards", "team"],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/awards/team`);
      if (!response.ok) {
        throw new Error("Failed to fetch team awards");
      }
      return response.json();
    },
  });

    const { data: personalAwards = [] } = useQuery<PersonalAward[]>({
    queryKey: ["/api/teams", id, "awards", "personal"],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/awards/personal`);
      if (!response.ok) {
        throw new Error("Failed to fetch personal awards");
      }
      return response.json();
    },
  });

  const { data: teamSeasonRecords = [] } = useQuery<TeamRecord[]>({
    queryKey: ["/api/teams", id, "records", "Season"],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/records/Season`);
      if (!response.ok) throw new Error("Failed to fetch season records");
      return response.json();
    },
  });

  const { data: careerRecords = [] } = useQuery<TeamRecord[]>({
    queryKey: ["/api/teams", id, "records", "Career"],
    enabled: !!id,
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/records/Career`);
      if (!response.ok) throw new Error("Failed to fetch career records");
      return response.json();
    },
  });

  const [isAddMomentOpen, setIsAddMomentOpen] = useState(false);
  const [isAddSeasonRecordOpen, setIsAddSeasonRecordOpen] = useState(false);
  const [isAddDepthChartOpen, setIsAddDepthChartOpen] = useState(false);
  const [isDuplicateDepthChartOpen, setIsDuplicateDepthChartOpen] = useState(false);
  const [duplicateSourceSeason, setDuplicateSourceSeason] = useState("");
const [duplicateDestinationSeason, setDuplicateDestinationSeason] = useState("");

  const { data: momentsRaw, isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ["/api/teams", id, "moments"],
    enabled: !!id,
  });
  const moments: Moment[] = Array.isArray(momentsRaw) ? momentsRaw : [];
  const { data: seasonRecordsRaw, isLoading: seasonRecordsLoading } = useQuery<SeasonRecord[]>({
    queryKey: ["/api/teams", id, "season-records"],
    enabled: !!id,
  });
  const seasonRecords: SeasonRecord[] = Array.isArray(seasonRecordsRaw) ? seasonRecordsRaw : [];
  const { data: depthChartRaw, isLoading: depthChartLoading } = useQuery<DepthChartEntry[]>({
    queryKey: ["/api/teams", id, "depth-chart"],
    enabled: !!id,
  });
  const depthChartEntries: DepthChartEntry[] = Array.isArray(depthChartRaw) ? depthChartRaw : [];
  const duplicateDepthChartMutation = useMutation({
  mutationFn: async () => {
    const sourceSeason = Number(duplicateSourceSeason);
    const destinationSeason = Number(duplicateDestinationSeason);

    if (!duplicateSourceSeason) {
      throw new Error("Select a source season.");
    }

    if (
      !duplicateDestinationSeason ||
      !Number.isInteger(destinationSeason) ||
      destinationSeason < 0
    ) {
      throw new Error("Enter a valid destination season.");
    }

    if (sourceSeason === destinationSeason) {
      throw new Error("The destination season must be different from the source season.");
    }

    const sourceEntries = depthChartEntries.filter(
      entry => entry.season === sourceSeason
    );

    if (sourceEntries.length === 0) {
      throw new Error("No depth chart entries were found for that season.");
    }

    const response = await apiRequest(
      "POST",
      `/api/teams/${id}/depth-chart`,
      {
        season: destinationSeason,
        entries: sourceEntries.map(entry => ({
          position: entry.position,
          playerName: entry.playerName,
          classYear: entry.classYear,
          overallRating: entry.overallRating,
          isRedshirted: entry.isRedshirted,
        })),
      },
    );

    return response.json();
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/teams", id, "depth-chart"],
    });

    toast({
      title: "Depth chart duplicated",
      description: `The ${duplicateSourceSeason} depth chart was copied to ${duplicateDestinationSeason}.`,
    });

    setDuplicateSourceSeason("");
    setDuplicateDestinationSeason("");
    setIsDuplicateDepthChartOpen(false);
  },

  onError: (err: Error) => {
    toast({
      title: "Unable to duplicate depth chart",
      description: err.message,
      variant: "destructive",
    });
  },
});

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-3xl font-bold text-display mb-4">Team Not Found</h2>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteTeam.mutateAsync(id);
    setLocation("/");
  };

  const careerWinPercentage = team.wins + team.losses > 0
    ? `${((team.wins / (team.wins + team.losses)) * 100).toFixed(1)}%`
    : "0.0%";

  const sortedMoments = [...moments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const sortedSeasonRecords = [...seasonRecords].sort((a, b) => b.season - a.season);
  const depthChartSeasons = Array.from(new Set(depthChartEntries.map(entry => entry.season))).sort((a, b) => b - a);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
<Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
</Link>

<div className="mb-8 overflow-x-auto">
  <div className="flex min-w-max border-b">
    {["Overview", "Hall of Fame", "Depth Chart", "Awards", "Records", "Moments"].map(tab => (
      <button
        key={tab}
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
          activeTab === tab
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
</div>

{/* Team Hero */}

      {/* Team Hero */}
      <div className="relative rounded-2xl bg-card border shadow-sm mb-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-background to-background" />
        <div className="p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-6">
            {team.logoUrl ? (
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-white border-4 border-background shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center shrink-0 text-primary">
                <Shield className="h-12 w-12 opacity-50" />
              </div>
            )}
            <div className="text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 uppercase tracking-widest font-semibold">
                  {team.conference}
                </Badge>
                {(team as any).leagueName && (
                  <Badge variant="secondary" className="uppercase tracking-widest font-semibold">
                    {(team as any).leagueName}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-display tracking-wide text-foreground mb-1 leading-none">
                {team.name}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">{team.mascot}</p>
              {(team as any).gameTitle && (
                <p className="text-sm text-muted-foreground/70 mt-1.5 flex items-center justify-center md:justify-start gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  {(team as any).gameTitle}
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Edit Team
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-display text-2xl tracking-wide">Edit Team Info</DialogTitle>
                    </DialogHeader>
                    <TeamForm team={team} onSuccess={() => setIsEditOpen(false)} />
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Team
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {team.name} and all its players and stats. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Delete Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

    {/* Coach + Roster */}
      <div className="space-y-6 mb-10">
        <Card className={`shadow-sm border-primary/10 ${activeTab !== "Overview" ? "hidden" : ""}`}>
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {(team as any).coachPhotoUrl ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm shrink-0">
                    <img
                      src={(team as any).coachPhotoUrl}
                      alt={(team as any).headCoachName || "Head Coach"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <UserPlus className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-display text-lg leading-none">Head Coach</h3>
                  <p className="text-sm text-muted-foreground">{(team as any).headCoachName || "TBD"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary/50 border border-border/50 px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Career Record</div>
                  <div className="text-lg font-bold text-display">{team.wins}-{team.losses}</div>
                </div>
                <div className="rounded-xl bg-secondary/50 border border-border/50 px-3 py-2 text-center hidden sm:block">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Career Win %</div>
                  <div className="text-lg font-bold text-display">{careerWinPercentage}</div>
                </div>
                {isAdmin && (
                  <Dialog open={isEditCoachOpen} onOpenChange={setIsEditCoachOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle className="text-display text-2xl tracking-wide">Edit Head Coach</DialogTitle>
                      </DialogHeader>
                      <CoachForm team={team} onSuccess={() => setIsEditCoachOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {([...((team as any).coachAwards ?? []), ...((team as any).coachAccolades ?? [])].length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Trophy className="h-3 w-3" /> Awards & Accolades
                  </h4>
                  <ul className="space-y-1.5">
                    {[...((team as any).coachAwards ?? []), ...((team as any).coachAccolades ?? [])].map((item: string, i: number) => (
                      <li key={i} className="text-sm font-medium border-l-2 border-primary/20 pl-3">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {((team as any).coachRecords?.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <ActivitySquare className="h-3 w-3" /> Records
                  </h4>
                  <ul className="space-y-1.5">
                    {(team as any).coachRecords.map((item: string, i: number) => (
                      <li key={i} className="text-sm font-medium border-l-2 border-primary/20 pl-3">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Season records */}
        <Card className={`shadow-sm border-primary/10 ${activeTab !== "Overview" ? "hidden" : ""}`}>
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-display tracking-wide">Season Records</h2>
                  <p className="text-sm text-muted-foreground">School win percentage by season</p>
                </div>
              </div>
              {isAdmin && (
                <Dialog open={isAddSeasonRecordOpen} onOpenChange={setIsAddSeasonRecordOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 hover-elevate">
                      <Plus className="h-4 w-4" /> Add Season
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="text-display text-2xl tracking-wide">Add Season Record</DialogTitle>
                    </DialogHeader>
                    <SeasonRecordForm teamId={team.id} onSuccess={() => setIsAddSeasonRecordOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {seasonRecordsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : sortedSeasonRecords.length > 0 ? (
              <div className="space-y-4">
                {sortedSeasonRecords.map(record => (
                  <SeasonRecordRow key={record.id} record={record} isAdmin={isAdmin} teamId={team.id} />
                ))}
                <div className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Below 25%</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Below 50%</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-green-500" /> Below 75%</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Below 100%</span>
                  <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" /> More than 12 games</span>
                </div>
              </div>
) : (
  <div className="py-8 text-center text-muted-foreground">
    <p className="font-medium">No season records yet.</p>
    <p className="text-sm mt-1">
      {isAdmin
        ? "Add the school’s first season record above."
        : "Check back soon for the school's season history."}
    </p>
  </div>
)}
          </CardContent>
                  </Card>

      {/* Depth Chart Archive */}
        <Card className={`shadow-sm border-primary/10 ${activeTab !== "Depth Chart" ? "hidden" : ""}`}>
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Shirt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-display tracking-wide">Depth Chart Archive</h2>
                  <p className="text-sm text-muted-foreground">
                    Yearly depth charts and roster history
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Dialog
                    open={isDuplicateDepthChartOpen}
                    onOpenChange={setIsDuplicateDepthChartOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 hover-elevate">
                        <Copy className="h-4 w-4" /> Duplicate Depth Chart
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-display text-2xl tracking-wide">
                          Duplicate Depth Chart
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-5">
                        <p className="text-sm text-muted-foreground">
                          Copy a depth chart from one season into another season. Only the depth chart players and their settings will be copied.
                        </p>

                        <div className="space-y-2">
                          <Label>Source Season</Label>
                          <Select
                            value={duplicateSourceSeason}
                            onValueChange={setDuplicateSourceSeason}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source season" />
                            </SelectTrigger>
                            <SelectContent>
                              {depthChartSeasons.map(season => (
                                <SelectItem key={season} value={String(season)}>
                                  {season}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Destination Season</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="e.g. 2027"
                            value={duplicateDestinationSeason}
                            onChange={event => setDuplicateDestinationSeason(event.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDuplicateDepthChartOpen(false)}
                          >
                            Cancel
                          </Button>

                          <Button
                            type="button"
                            className="gap-2"
                            onClick={() => duplicateDepthChartMutation.mutate()}
                            disabled={duplicateDepthChartMutation.isPending}
                          >
                            <Copy className="h-4 w-4" />
                            {duplicateDepthChartMutation.isPending ? "Duplicating..." : "Duplicate"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isAddDepthChartOpen}
                    onOpenChange={setIsAddDepthChartOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2 hover-elevate">
                        <Plus className="h-4 w-4" /> Upload Roster
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-[720px]">
                      <DialogHeader>
                        <DialogTitle className="text-display text-2xl tracking-wide">
                          Upload Roster
                        </DialogTitle>
                      </DialogHeader>

                      <DepthChartForm
                        teamId={team.id}
                        onSuccess={() => setIsAddDepthChartOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {depthChartLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : depthChartSeasons.length > 0 ? (
              <div className="space-y-6">
                {depthChartSeasons.map(season => (
                  <DepthChartYear
                    key={season}
                    season={season}
                    entries={depthChartEntries.filter(entry => entry.season === season)}
                    isAdmin={isAdmin}
                    teamId={team.id}
                    players={team.players || []}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No archived rosters yet.</p>
                <p className="text-sm mt-1">
                  {isAdmin ? 'Upload the school’s first yearly roster above.' : "Check back soon for the school's roster history."}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 border-t pt-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Below 75</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> 75–79</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-green-500" /> 80–85</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" /> 86–90</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" /> 91+</span>
              <span className="ml-auto">Ratings match player profiles.</span>
            </div>
          </CardContent>
        </Card>

        {/* Hall of Fame roster */}
        <div className={`rounded-2xl border bg-card overflow-hidden shadow-sm ${activeTab !== "Hall of Fame" ? "hidden" : ""}`}>
          <div className="bg-muted/50 p-4 border-b flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
      <UserPlus className="h-5 w-5" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-display tracking-wide">Hall of Fame</h2>
      <p className="text-sm text-muted-foreground">
        {team.players?.length || 0} Players
      </p>
    </div>
  </div>

  {isAdmin && (
    <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 hover-elevate">
          <Plus className="h-4 w-4" /> Add Player
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl tracking-wide">
            Add Player to Hall of Fame
          </DialogTitle>
        </DialogHeader>

        <PlayerForm
          teamId={team.id}
          onSuccess={() => setIsAddPlayerOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )}
</div>
          {team.players && team.players.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[64px] font-bold text-center">Avatar</TableHead>
                  <TableHead className="font-bold">Player Name</TableHead>
                  <TableHead className="font-bold">Pos</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold hidden md:table-cell">HT / WT</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(team.players || [])]
                  .sort((a, b) => {
                    const positionOrder: Record<string, number> = {
                      QB: 1, RB: 2, FB: 3, WR: 4, TE: 5,
                      OL: 6, DL: 7, EDGE: 8, LB: 9, CB: 10, S: 11,
                    };
                    const orderA = positionOrder[a.position.toUpperCase()] || 99;
                    const orderB = positionOrder[b.position.toUpperCase()] || 99;
                    if (orderA !== orderB) return orderA - orderB;
                    const lastA = a.name.split(" ").pop() || "";
                    const lastB = b.name.split(" ").pop() || "";
                    return lastA.localeCompare(lastB);
                  })
                  .map(player => (
                    <TableRow key={player.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="p-2">
                        <div className="flex justify-center">
                          <div className="h-10 w-10 rounded-full bg-primary/20 overflow-hidden border border-primary/10 flex-shrink-0">
                            <PlayerAvatar
                              imageUrl={(player as any).imageUrl}
                              skinTone={player.skinTone}
                              hairColor={player.hairColor}
                              hairStyle={player.hairStyle}
                              facialHair={player.facialHair}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <Link href={`/players/${player.id}`} className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                          <span className="inline-flex items-center gap-1.5">
                            {player.name}
                            {player.isRedshirted && <Shirt className="h-4 w-4 text-red-600 fill-red-100" aria-label="Redshirted" />}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-bold uppercase rounded-md">{player.position}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {player.status === "Drafted" ? `Drafted (R${(player as any).draftRound} P${(player as any).draftPick})` : player.status}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {player.height ? `${player.height} / ` : ""}{player.weight ? `${player.weight} lbs` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/players/${player.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No players in the Hall of Fame yet.</p>
            </div>
          )}
        </div>
        </div>

{/* ── Records ───────────────────────────────────────────── */}
<div className={`space-y-6 pb-10 ${activeTab !== "Records" ? "hidden" : ""}`}>
    {/* Game Records */}
  <Card className="shadow-sm border-primary/10">
    <CardHeader className="bg-primary/5 pb-4 border-b">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-display tracking-wide">Game Records</h2>
          <p className="text-sm text-muted-foreground">
            Best single-game performances
          </p>
        </div>

        {isAdmin && (
          <Button
            className="gap-2 hover-elevate"
            onClick={() => {
              setRecordType("Game");
              setIsAddRecordOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </CardHeader>

    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Passing Yards",
          "Passing Touchdowns",
          "Rushing Yards",
          "Rushing Touchdowns",
          "Receiving Yards",
          "Receiving Touchdowns",
          "Sacks",
          "Interceptions",
        ].map(category => {
          const record = gameRecords
  .filter(item => item.category === category)
  .sort((a, b) => b.value - a.value)[0];

          return (
            <div
  key={category}
  className="rounded-lg border p-4 flex items-center justify-between gap-3"
>
              <p className="font-semibold">{category}</p>

              {record ? (
  <div className="mt-1 flex-1">
                  <p className="text-lg font-bold">
                    {record.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.playerName} • {record.season}
                  </p>
                </div>
) : (
  <p className="text-sm text-muted-foreground mt-1">
    No record set
  </p>
)}

{isAdmin && record && (
  <Button
    variant="ghost"
    size="icon"
    className="shrink-0 text-destructive"
    onClick={async () => {
      try {
        const response = await fetch(
          `/api/teams/${id}/records/${record.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete record");
        }

        queryClient.invalidateQueries({
          queryKey: ["/api/teams", id, "records", "Game"],
        });

        toast({
          title: "Record deleted",
          description: "The record has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the record.",
          variant: "destructive",
        });
      }
    }}
  >
    ×
  </Button>
)}
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>

    {/* Season Records */}
  <Card className="shadow-sm border-primary/10">
    <CardHeader className="bg-primary/5 pb-4 border-b">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-display tracking-wide">Season Records</h2>
          <p className="text-sm text-muted-foreground">
            Best single-season performances
          </p>
        </div>

        {isAdmin && (
          <Button
            className="gap-2 hover-elevate"
            onClick={() => {
              setRecordType("Season");
              setIsAddRecordOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </CardHeader>

    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Passing Yards",
          "Passing Touchdowns",
          "Rushing Yards",
          "Rushing Touchdowns",
          "Receiving Yards",
          "Receiving Touchdowns",
          "Sacks",
          "Interceptions",
        ].map(category => {
          const record = teamSeasonRecords
  .filter(item => item.category === category)
  .sort((a, b) => b.value - a.value)[0];

          return (
            <div
  key={category}
  className="rounded-lg border p-4 flex items-center justify-between gap-3"
>
              <p className="font-semibold">{category}</p>

              {record ? (
                <div className="mt-1 flex-1">
                  <p className="text-lg font-bold">
                    {record.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.playerName} • {record.season}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No record set
                </p>
              )}
              {isAdmin && record && (
  <Button
    variant="ghost"
    size="icon"
    className="shrink-0 text-destructive"
    onClick={async () => {
      try {
        const response = await fetch(
          `/api/teams/${id}/records/${record.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete record");
        }

        queryClient.invalidateQueries({
          queryKey: ["/api/teams", id, "records", "Season"],
        });

        toast({
          title: "Record deleted",
          description: "The record has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the record.",
          variant: "destructive",
        });
      }
    }}
  >
    ×
  </Button>
)}
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>

    {/* Career Records */}
  <Card className="shadow-sm border-primary/10">
    <CardHeader className="bg-primary/5 pb-4 border-b">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-display tracking-wide">Career Records</h2>
          <p className="text-sm text-muted-foreground">
            Best career performances
          </p>
        </div>

        {isAdmin && (
          <Button
            className="gap-2 hover-elevate"
            onClick={() => {
              setRecordType("Career");
              setIsAddRecordOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </CardHeader>

    <CardContent className="pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Passing Yards",
          "Passing Touchdowns",
          "Rushing Yards",
          "Rushing Touchdowns",
          "Receiving Yards",
          "Receiving Touchdowns",
          "Sacks",
          "Interceptions",
        ].map(category => {
          const record = careerRecords
  .filter(item => item.category === category)
  .sort((a, b) => b.value - a.value)[0];

          return (
            <div
  key={category}
  className="rounded-lg border p-4 flex items-center justify-between gap-3"
>
              <p className="font-semibold">{category}</p>

              {record ? (
                <div className="mt-1 flex-1">
                  <p className="text-lg font-bold">
                    {record.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.playerName} • {record.season}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No record set
                </p>
              )}
              {isAdmin && record && (
  <Button
    variant="ghost"
    size="icon"
    className="shrink-0 text-destructive"
    onClick={async () => {
      try {
        const response = await fetch(
          `/api/teams/${id}/records/${record.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete record");
        }

        queryClient.invalidateQueries({
          queryKey: ["/api/teams", id, "records", "Career"],
        });

        toast({
          title: "Record deleted",
          description: "The record has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the record.",
          variant: "destructive",
        });
      }
    }}
  >
    ×
  </Button>
)}
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>

  <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="text-display text-2xl tracking-wide">
          Add {recordType} Record
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Category</Label>
          <Select value={recordCategory} onValueChange={setRecordCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select record category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Passing Yards">Passing Yards</SelectItem>
              <SelectItem value="Passing Touchdowns">Passing Touchdowns</SelectItem>
              <SelectItem value="Rushing Yards">Rushing Yards</SelectItem>
              <SelectItem value="Rushing Touchdowns">Rushing Touchdowns</SelectItem>
              <SelectItem value="Receiving Yards">Receiving Yards</SelectItem>
              <SelectItem value="Receiving Touchdowns">Receiving Touchdowns</SelectItem>
              <SelectItem value="Sacks">Sacks</SelectItem>
              <SelectItem value="Interceptions">Interceptions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Player</Label>
<Input
  placeholder="e.g. Alex Windham"
  value={recordPlayer}
  onChange={event => setRecordPlayer(event.target.value)}
/>
        </div>

        <div>
          <Label>Value</Label>
<Input
  type="number"
  placeholder="e.g. 425"
  value={recordValue}
  onChange={event => setRecordValue(event.target.value)}
/>
        </div>

        <div>
          <Label>Season</Label>
<Input
  type="number"
  placeholder="2026"
  value={recordSeason}
  onChange={event => setRecordSeason(event.target.value)}
/>
        </div>

        <Button
  className="w-full"
  onClick={async () => {
    try {
      const response = await fetch(`/api/teams/${id}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordType,
          category: recordCategory,
          playerName: recordPlayer,
          value: Number(recordValue),
          season: Number(recordSeason),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save record");
      }

      setIsAddRecordOpen(false);
      setRecordCategory("");
      setRecordPlayer("");
      setRecordValue("");
      setRecordSeason("");

      queryClient.invalidateQueries({
        queryKey: ["/api/teams", id, "records", recordType],
      });

      toast({
        title: "Record saved",
        description: "The record has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the record.",
        variant: "destructive",
      });
    }
  }}
>
  Save Record
</Button>
      </div>
    </DialogContent>
  </Dialog>
</div>

{/* ── Awards ───────────────────────────────────────────── */}
<div className={`space-y-6 pb-10 ${activeTab !== "Awards" ? "hidden" : ""}`}>
  {/* Team Awards */}
  <Card className="shadow-sm border-primary/10">
    <CardHeader className="bg-primary/5 pb-4 border-b">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-display tracking-wide">Team Awards</h2>
            <p className="text-sm text-muted-foreground">
              Championships, bowl victories & playoff wins
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            className="gap-2 hover-elevate"
            onClick={() => setIsAddTeamAwardOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </CardHeader>

        <CardContent className="pt-6">
      {teamAwards.length > 0 ? (
        <div className="space-y-3">
          {teamAwards.map((award) => (
            <div
              key={award.id}
              className="rounded-lg border p-4 flex items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-semibold">{award.awardType}</h3>
                <p className="text-sm text-muted-foreground">
                  {award.opponent} • {award.finalScore}
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {award.season}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No team awards recorded yet.</p>
        </div>
      )}
    </CardContent>
  </Card>

  <Dialog open={isAddTeamAwardOpen} onOpenChange={setIsAddTeamAwardOpen}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="text-display text-2xl tracking-wide">
          Add Team Award
        </DialogTitle>
      </DialogHeader>

            <div className="space-y-4">
        <div>
          <Label>Award Type</Label>
          <Select value={teamAwardType} onValueChange={setTeamAwardType}>
            <SelectTrigger>
              <SelectValue placeholder="Select award type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conference">Conference Championship</SelectItem>
              <SelectItem value="bowl">Bowl Victory</SelectItem>
              <SelectItem value="cfp">CFP Victory</SelectItem>
              <SelectItem value="national">National Championship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Opponent</Label>
          <Input
            placeholder="e.g. Florida Atlantic"
            value={teamAwardOpponent}
            onChange={(e) => setTeamAwardOpponent(e.target.value)}
          />
        </div>

        <div>
          <Label>Final Score</Label>
          <Input
            placeholder="e.g. 31-24"
            value={teamAwardScore}
            onChange={(e) => setTeamAwardScore(e.target.value)}
          />
        </div>

        <div>
          <Label>Season</Label>
          <Input
            type="number"
            placeholder="2026"
            value={teamAwardSeason}
            onChange={(e) => setTeamAwardSeason(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={async () => {
            try {
              const response = await fetch(`/api/teams/${id}/awards/team`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  awardType:
                    teamAwardType === "conference"
                      ? "Conference Championship"
                      : teamAwardType === "bowl"
                        ? "Bowl Victory"
                        : teamAwardType === "cfp"
                          ? "CFP Victory"
                          : "National Championship",
                  opponent: teamAwardOpponent,
                  finalScore: teamAwardScore,
                  season: Number(teamAwardSeason),
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to save team award");
              }

              setIsAddTeamAwardOpen(false);
              setTeamAwardType("");
              setTeamAwardOpponent("");
              setTeamAwardScore("");
              setTeamAwardSeason("");
                            queryClient.invalidateQueries({
                queryKey: ["/api/teams", id, "awards", "team"],
              });

              toast({
                title: "Award saved",
                description: "The team award has been added successfully.",
              });
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to save the team award.",
                variant: "destructive",
              });
            }
          }}
        >
          Save Award
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* Personal Awards */}
  <Card className="shadow-sm border-primary/10">
    <CardHeader className="bg-primary/5 pb-4 border-b">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Medal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-display tracking-wide">Personal Awards</h2>
            <p className="text-sm text-muted-foreground">
              Player awards, honors & achievements
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
  className="gap-2 hover-elevate"
  onClick={() => setIsAddPersonalAwardOpen(true)}
>
  <Plus className="h-4 w-4" /> Add
</Button>
        )}
      </div>
    </CardHeader>

    <CardContent className="pt-6">
  {personalAwards.length > 0 ? (
    <div className="space-y-3">
      {personalAwards.map((award) => (
        <div
          key={award.id}
          className="rounded-lg border p-4 flex items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-semibold">{award.playerName}</h3>
            <p className="text-sm text-muted-foreground">
              {award.award}
            </p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {award.season}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <div className="py-10 text-center text-muted-foreground">
      <Medal className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="font-medium">No personal awards recorded yet.</p>
    </div>
  )}
</CardContent>
</Card>

  <Dialog open={isAddPersonalAwardOpen} onOpenChange={setIsAddPersonalAwardOpen}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="text-display text-2xl tracking-wide">
          Add Personal Award
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label>Player</Label>
          <Input
  placeholder="e.g. Brenton Russo"
  value={personalAwardPlayer}
  onChange={(e) => setPersonalAwardPlayer(e.target.value)}
/>
        </div>

        <div>
          <Label>Award</Label>
          <Input
  placeholder="e.g. Conference MVP"
  value={personalAwardName}
  onChange={(e) => setPersonalAwardName(e.target.value)}
/>
        </div>

        <div>
          <Label>Season</Label>
          <Input
  type="number"
  placeholder="2026"
  value={personalAwardSeason}
  onChange={(e) => setPersonalAwardSeason(e.target.value)}
/>
        </div>

        <Button
  className="w-full"
  onClick={async () => {
    try {
      const response = await fetch(`/api/teams/${id}/awards/personal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: personalAwardPlayer,
          award: personalAwardName,
          season: Number(personalAwardSeason),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save personal award");
      }

      setIsAddPersonalAwardOpen(false);
      setPersonalAwardPlayer("");
      setPersonalAwardName("");
      setPersonalAwardSeason("");
            queryClient.invalidateQueries({
        queryKey: ["/api/teams", id, "awards", "personal"],
      });

      toast({
        title: "Award saved",
        description: "The personal award has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the personal award.",
        variant: "destructive",
      });
    }
  }}
>
  Save Award
</Button>
      </div>
    </DialogContent>
  </Dialog>
</div>

      {/* ── Upload a Moment ───────────────────────────────────────────── */}
      <div className={`space-y-6 pb-10 ${activeTab !== "Moments" ? "hidden" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-display tracking-wide">Upload a Moment</h2>
              <p className="text-sm text-muted-foreground">Game recaps, milestones &amp; memories</p>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={isAddMomentOpen} onOpenChange={setIsAddMomentOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 hover-elevate">
                  <Plus className="h-4 w-4" /> Post a Moment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle className="text-display text-2xl tracking-wide">Upload a Moment</DialogTitle>
                </DialogHeader>
                <MomentForm teamId={team.id} onSuccess={() => setIsAddMomentOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {momentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : sortedMoments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMoments.map(m => (
              <MomentCard key={m.id} moment={m} isAdmin={isAdmin} teamId={team.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-14 text-center">
            <Camera className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-semibold text-foreground mb-1">No moments yet</p>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? 'Hit "Post a Moment" to share the first story.' : "Check back soon for game recaps and highlights."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

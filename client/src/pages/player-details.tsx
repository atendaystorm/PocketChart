import { useRoute, Link, useLocation } from "wouter";
import { usePlayer, useDeletePlayer } from "@/hooks/use-players";
import { useDeletePlayerStat } from "@/hooks/use-player-stats";
import { ArrowLeft, Pencil, Trash2, Shield, PlusCircle, ActivitySquare, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerForm } from "@/components/forms/player-form";
import { StatForm } from "@/components/forms/stat-form";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { PlayerAvatar } from "@/components/player-avatar";
import { useAuth } from "@/context/auth-context";

export default function PlayerDetails() {
  const [, params] = useRoute("/players/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  
  const { data: player, isLoading } = usePlayer(id);
  const deletePlayer = useDeletePlayer();
  const deleteStat = useDeletePlayerStat();
  const { isAdmin } = useAuth();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStatOpen, setIsAddStatOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<any>(null);
  const [qbChartTab, setQbChartTab] = useState<"passing" | "rushing">("passing");
  const [rbChartTab, setRbChartTab] = useState<"rushing" | "receiving">("rushing");
  const [wrChartTab, setWrChartTab] = useState<"receiving" | "rushing">("receiving");
  const [defChartTab, setDefChartTab] = useState<"production" | "turnovers">("production");

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-3xl font-bold text-display mb-4">Player Not Found</h2>
        <Link href="/players">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Players</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    await deletePlayer.mutateAsync(id);
    setLocation(player.teamId ? `/teams/${player.teamId}` : "/players");
  };

  const handleEditStat = (stat: any) => {
    setEditingStat(stat);
    setIsAddStatOpen(true);
  };

  // Setup data for chart
  const sortedStats = [...(player.stats || [])].sort((a, b) => a.season - b.season);

  // Determine position category and stats to show
  const pos = player.position.toUpperCase();
  const isQB = pos === 'QB';
  const isRB = pos === 'RB';
  const isWR = pos === 'WR' || pos === 'TE';
  const isDefense = ['LB', 'DE', 'DT', 'CB', 'S', 'DB', 'DL', 'EDGE', 'SS', 'FS'].includes(pos);

  // Each chart can have multiple lines: { label, lines: [{ key, color, name }] }
  const statsToShow: { label: string; lines: { key: string; color: string; name: string }[] }[] = [];
  if (isQB) {
  statsToShow.push({
    label: 'Passing Yards',
    lines: [
      { key: 'Pass', color: 'hsl(var(--chart-1))', name: 'Passing Yards' },
    ]
  });

  statsToShow.push({
    label: 'Passing TDs',
    lines: [
      { key: 'PassTDs', color: 'hsl(var(--chart-5))', name: 'Passing TDs' },
    ]
  });

  statsToShow.push({
    label: 'Comp %',
    lines: [
      { key: 'CompPct', color: 'hsl(var(--chart-2))', name: 'Completion %' },
    ]
  });

  statsToShow.push({
    label: 'Interceptions',
    lines: [
      { key: 'INTs', color: 'hsl(var(--chart-3))', name: 'Interceptions' },
    ]
  });

  statsToShow.push({
    label: 'Rushing Yards',
    lines: [
      { key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rushing Yards' },
    ]
  });

  statsToShow.push({
    label: 'Rushing TDs',
    lines: [
      { key: 'RushTDs', color: 'hsl(var(--chart-5))', name: 'Rushing TDs' },
    ]
  });
  } else if (isRB) {
    statsToShow.push({
      label: 'Rushing Yards',
      lines: [
        { key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rushing Yards' },
      ]
    });

    statsToShow.push({
      label: 'Rushing TDs',
      lines: [
        { key: 'RushTDs', color: 'hsl(var(--chart-5))', name: 'Rushing TDs' },
      ]
    });

    statsToShow.push({
      label: 'Receiving Yards',
      lines: [
        { key: 'Rec', color: 'hsl(var(--chart-3))', name: 'Receiving Yards' },
      ]
    });

    statsToShow.push({
      label: 'Receiving TDs',
      lines: [
        { key: 'RecTDs', color: 'hsl(var(--chart-5))', name: 'Receiving TDs' },
      ]
    });
        } else if (isWR) {
      statsToShow.push({
        label: 'Receiving Yards',
        lines: [
          { key: 'Rec', color: 'hsl(var(--chart-3))', name: 'Receiving Yards' },
        ]
      });

      statsToShow.push({
        label: 'Receiving TDs',
        lines: [
          { key: 'RecTDs', color: 'hsl(var(--chart-5))', name: 'Receiving TDs' },
        ]
      });

      statsToShow.push({
        label: 'Rushing Yards',
        lines: [
          { key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rushing Yards' },
        ]
      });

      statsToShow.push({
        label: 'Rushing TDs',
        lines: [
          { key: 'RushTDs', color: 'hsl(var(--chart-5))', name: 'Rushing TDs' },
        ]
      });
    } else if (isDefense) {
      statsToShow.push({
        label: 'Tackles',
        lines: [
          { key: 'Tackles', color: 'hsl(var(--chart-4))', name: 'Tackles' },
        ]
      });

      statsToShow.push({
        label: 'Tackles for Loss',
        lines: [
          { key: 'TFL', color: 'hsl(var(--chart-2))', name: 'Tackles for Loss' },
        ]
      });

      statsToShow.push({
        label: 'Sacks',
        lines: [
          { key: 'Sacks', color: 'hsl(var(--chart-1))', name: 'Sacks' },
        ]
      });

      statsToShow.push({
        label: 'Pass Deflections',
        lines: [
          { key: 'PDs', color: 'hsl(var(--chart-5))', name: 'Pass Deflections' },
        ]
      });

      statsToShow.push({
        label: 'Interceptions',
        lines: [
          { key: 'INTs', color: 'hsl(var(--chart-3))', name: 'Interceptions' },
        ]
      });

      statsToShow.push({
        label: 'Forced Fumbles',
        lines: [
          { key: 'FF', color: 'hsl(var(--chart-2))', name: 'Forced Fumbles' },
        ]
      });

      statsToShow.push({
        label: 'Fumbles Recovered',
        lines: [
          { key: 'FR', color: 'hsl(var(--chart-4))', name: 'Fumbles Recovered' },
        ]
      });

      statsToShow.push({
        label: 'Defensive Touchdowns',
        lines: [
          { key: 'DefTDs', color: 'hsl(var(--chart-1))', name: 'Defensive Touchdowns' },
        ]
      });
  } else {
    statsToShow.push({ label: 'Yards', lines: [{ key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rush Yds' }, { key: 'Rec', color: 'hsl(var(--chart-3))', name: 'Rec Yds' }] });
    statsToShow.push({ label: 'Touchdowns', lines: [{ key: 'TDs', color: 'hsl(var(--chart-5))', name: 'TDs' }] });
  }

  const chartData = sortedStats.map(s => {
    const passTDs = (s as any).passingTouchdowns || 0;
    const rushTDs = (s as any).rushingTouchdowns || 0;
    const recTDs = (s as any).receivingTouchdowns || 0;
    const legacyTDs = s.touchdowns || 0;
    // If new split TD fields are all 0 but old field has data, fall back to legacy
    const hasNewTDData = passTDs > 0 || rushTDs > 0 || recTDs > 0;

    return {
      name: s.season.toString(),
      Pass: s.passingYards,
      Rush: s.rushingYards,
      Rec: s.receivingYards,
      Tackles: s.tackles,
      TFL: (s as any).tacklesForLoss || 0,
      Sacks: s.sacks,
      INTs: s.interceptions,
      CompPct: (s as any).completionPercentage || 0,
      BrokenTackles: (s as any).brokenTackles || 0,
      Fumbles: (s as any).fumbles || 0,
      AvgRushPerGame: Number(s.gamesPlayed) > 0 ? Math.round((Number(s.rushingYards) / Number(s.gamesPlayed)) * 10) / 10 : 0,
      AvgYdsPerCarry: Number((s as any).carries) > 0 ? Math.round((Number(s.rushingYards) / Number((s as any).carries)) * 10) / 10 : 0,
      PDs: (s as any).passDeflections || 0,
      DefTDs: (s as any).defensiveTouchdowns || 0,
      FF: (s as any).forcedFumbles || 0,
      FR: (s as any).fumbleRecoveries || 0,
      TDs: legacyTDs,
      PassTDs: hasNewTDData ? passTDs : (isQB ? legacyTDs : 0),
      RushTDs: hasNewTDData ? rushTDs : (isRB ? legacyTDs : 0),
      RecTDs: hasNewTDData ? recTDs : (isWR ? legacyTDs : 0),
    };
  });
  
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <Link href={player.teamId ? `/teams/${player.teamId}` : "/players"} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> {player.team ? `Back to Hall of Fame` : "Back to Players"}
      </Link>

      <div className="relative rounded-2xl bg-card border shadow-sm mb-8 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-1/3 bg-muted/30 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border relative">
          {/* Giant subtle jersey number in background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] font-bold text-display text-muted-foreground/5 pointer-events-none select-none">
            {player.jerseyNumber}
          </div>
          
          <div className="h-32 w-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mb-4 z-10 overflow-hidden border-4 border-primary-foreground/20">
            <PlayerAvatar 
              imageUrl={(player as any).imageUrl}
              skinTone={player.skinTone} 
              hairColor={player.hairColor} 
              hairStyle={player.hairStyle} 
              facialHair={player.facialHair} 
              className="w-full h-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-display tracking-wide mb-1 z-10 inline-flex items-center gap-2">
            {player.name}
            {player.isRedshirted && <Shirt className="h-7 w-7 text-red-600 fill-red-100" aria-label="Redshirted" />}
          </h1>
          
          {player.team && (
            <Link href={`/teams/${player.team.id}`} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors z-10 mt-2">
              {player.team.logoUrl ? (
                <img src={player.team.logoUrl} className="h-5 w-5 object-contain" alt="" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {player.team.name}
            </Link>
          )}
        </div>
        
                <div className="p-8 md:w-2/3 flex flex-col relative z-10">
          <div className="flex flex-col mb-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                {player.position}
              </Badge>

              <Badge variant="secondary" className="px-4 py-1 text-sm">
                {(player as any).status === 'Drafted'
                  ? `Drafted (R${(player as any).draftRound} P${(player as any).draftPick})`
                  : (player as any).status}
              </Badge>

              {player.height && (
                <Badge variant="outline" className="px-4 py-1 text-sm">
                  HT: {player.height}
                </Badge>
              )}

              {player.weight && (
                <Badge variant="outline" className="px-4 py-1 text-sm">
                  WT: {player.weight} lbs
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div
                className={`flex items-center justify-center w-20 h-20 rounded-xl border ${
                  ((player as any).overallRating || 0) < 65
                    ? "bg-red-500/10 border-red-500/30"
                    : ((player as any).overallRating || 0) < 75
                      ? "bg-yellow-400/10 border-yellow-400/30"
                      : ((player as any).overallRating || 0) < 85
                        ? "bg-green-500/10 border-green-500/30"
                        : ((player as any).overallRating || 0) < 95
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                }`}
              >
                <span
                  className={`text-5xl font-black leading-none ${
                    ((player as any).overallRating || 0) < 65
                      ? "text-red-500"
                      : ((player as any).overallRating || 0) < 75
                        ? "text-yellow-500"
                        : ((player as any).overallRating || 0) < 85
                          ? "text-green-500"
                          : ((player as any).overallRating || 0) < 95
                            ? "text-blue-500"
                            : "text-[#D4AF37]"
                  }`}
                >
                  {(player as any).overallRating || 0}
                </span>
              </div>

              <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-muted/40 border border-border/70">
                <img
                  src={`/dev-traits/${((player as any).devTrait || "Normal").toLowerCase()}dev.png`}
                  alt={(player as any).devTrait || "Normal"}
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
          </div>

          {player.accolades && player.accolades.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Awards & Accolades
              </h3>
              <div className="flex flex-wrap gap-2">
                {player.accolades.map((accolade, i) => (
                  <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800">
                    {accolade}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {isAdmin && (
            <div className="flex flex-wrap items-end gap-3 mt-auto pt-8 border-t border-border/50">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="hover-elevate">
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-display text-2xl tracking-wide">Edit Player Info</DialogTitle>
                  </DialogHeader>
                  <PlayerForm player={player} onSuccess={() => setIsEditOpen(false)} />
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this player?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {player.name} and all associated stats. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Delete Player
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 && (
  <div className="mb-8">
    {isQB ? (
      <>
        {/* QB chart tabs */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-display tracking-wide">
              Career Progression
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Season-by-season statistical trajectory
            </p>
          </div>

          <div className="flex rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setQbChartTab("passing")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                qbChartTab === "passing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Passing
            </button>

            <button
              type="button"
              onClick={() => setQbChartTab("rushing")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                qbChartTab === "rushing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rushing
            </button>
          </div>
        </div>

        {/* QB charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsToShow
            .filter((chart) =>
              qbChartTab === "passing"
                                ? [
                    "Passing Yards",
                    "Passing TDs",
                    "Completion %",
                    "Interceptions",
                  ].includes(chart.label)
                : [
                    "Rushing Yards",
                    "Rushing TDs",
                  ].includes(chart.label)
            )
            .map((chart) => (
              <Card
                key={chart.label}
                className="shadow-sm overflow-hidden border-border/70"
              >
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-display tracking-wide">
                      {chart.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Season progression
                    </p>
                  </div>

                  <div className="h-[190px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 8,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="opacity-20"
                        />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          dy={5}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9 }}
                          width={38}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--background))",
                            boxShadow:
                              "0 8px 24px rgba(0,0,0,0.12)",
                            fontSize: "12px",
                          }}
                          labelStyle={{
                            fontWeight: 700,
                            marginBottom: "4px",
                          }}
                        />

                        {chart.lines.map((line) => (
                          <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={2.5}
                            dot={{
                              r: 3,
                              strokeWidth: 2,
                              fill: "hsl(var(--background))",
                            }}
                            activeDot={{
                              r: 5,
                              strokeWidth: 2,
                            }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
                        ))}
        </div>
      </>
    ) : isRB ? (
      <>
        {/* RB chart tabs */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-display tracking-wide">
              Career Progression
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Season-by-season statistical trajectory
            </p>
          </div>

          <div className="flex rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setRbChartTab("rushing")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                rbChartTab === "rushing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rushing
            </button>

            <button
              type="button"
              onClick={() => setRbChartTab("receiving")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                rbChartTab === "receiving"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Receiving
            </button>
          </div>
        </div>

        {/* RB charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsToShow
            .filter((chart) =>
              rbChartTab === "rushing"
                ? ["Rushing Yards", "Rushing TDs"].includes(chart.label)
                : ["Receiving Yards", "Receiving TDs"].includes(chart.label)
            )
            .map((chart) => (
              <Card
                key={chart.label}
                className="shadow-sm overflow-hidden border-border/70"
              >
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-display tracking-wide">
                      {chart.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Season progression
                    </p>
                  </div>

                  <div className="h-[190px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 8,
                          left: -18,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="opacity-20"
                        />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          dy={5}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9 }}
                          width={38}
                        />

                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--background))",
                            boxShadow:
                              "0 8px 24px rgba(0,0,0,0.12)",
                            fontSize: "12px",
                          }}
                          labelStyle={{
                            fontWeight: 700,
                            marginBottom: "4px",
                          }}
                        />

                        {chart.lines.map((line) => (
                          <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={2.5}
                            dot={{
                              r: 3,
                              strokeWidth: 2,
                              fill: "hsl(var(--background))",
                            }}
                            activeDot={{
                              r: 5,
                              strokeWidth: 2,
                            }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
             ))}
        </div>
      </>
    ) : isWR ? (
      <>
        {/* WR / TE chart tabs */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-display tracking-wide">
              Career Progression
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Season-by-season statistical trajectory
            </p>
          </div>

          <div className="flex rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setWrChartTab("receiving")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                wrChartTab === "receiving"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Receiving
            </button>

            <button
              type="button"
              onClick={() => setWrChartTab("rushing")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                wrChartTab === "rushing"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rushing
            </button>
          </div>
        </div>

        {/* WR / TE charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsToShow
            .filter((chart) =>
              wrChartTab === "receiving"
                ? ["Receiving Yards", "Receiving TDs"].includes(chart.label)
                : ["Rushing Yards", "Rushing TDs"].includes(chart.label)
            )
            .map((chart) => (
          <Card
            key={chart.label}
            className="shadow-sm overflow-hidden border-border/70"
          >
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-display tracking-wide">
                  {chart.label}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Season progression
                </p>
              </div>

              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 8,
                      left: -18,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="opacity-20"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                      dy={5}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9 }}
                      width={38}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                        boxShadow:
                          "0 8px 24px rgba(0,0,0,0.12)",
                        fontSize: "12px",
                      }}
                    />

                    {chart.lines.map((line) => (
                      <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        name={line.name}
                        stroke={line.color}
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          fill: "hsl(var(--background))",
                        }}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                        }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
  </div>
      </>
        ) : isDefense ? (
      <>
                <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-display tracking-wide">
              Career Progression
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Season-by-season statistical trajectory
            </p>
          </div>

          <div className="flex rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setDefChartTab("production")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                defChartTab === "production"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Production
            </button>

            <button
              type="button"
              onClick={() => setDefChartTab("turnovers")}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                defChartTab === "turnovers"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Turnovers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsToShow
            .filter((chart) =>
              defChartTab === "production"
                ? [
                    "Tackles",
                    "Tackles for Loss",
                    "Sacks",
                    "Pass Deflections",
                  ].includes(chart.label)
                : [
                    "Interceptions",
                    "Forced Fumbles",
                    "Fumbles Recovered",
                    "Defensive Touchdowns",
                  ].includes(chart.label)
            )
            .map((chart) => (
              <Card
                key={chart.label}
                className="shadow-sm overflow-hidden border-border/70"
              >
                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-sm">{chart.label}</h3>
                  </div>

                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid hsl(var(--border))",
                            backgroundColor: "hsl(var(--background))",
                            boxShadow:
                              "0 8px 24px rgba(0,0,0,0.12)",
                            fontSize: "12px",
                          }}
                        />

                        {chart.lines.map((line) => (
                          <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={2.5}
                            dot={{
                              r: 3,
                              strokeWidth: 2,
                              fill: "hsl(var(--background))",
                            }}
                            activeDot={{
                              r: 5,
                              strokeWidth: 2,
                            }}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsToShow.map((chart) => (
            <Card
              key={chart.label}
              className="shadow-sm overflow-hidden border-border/70"
            >
              <CardContent className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-sm">{chart.label}</h3>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--background))",
                          boxShadow:
                            "0 8px 24px rgba(0,0,0,0.12)",
                          fontSize: "12px",
                        }}
                      />

                      {chart.lines.map((line) => (
                        <Line
                          key={line.key}
                          type="monotone"
                          dataKey={line.key}
                          name={line.name}
                          stroke={line.color}
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                            strokeWidth: 2,
                            fill: "hsl(var(--background))",
                          }}
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                          }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )}
  </div>
)}


      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-display tracking-wide">Season Stats</h2>
        
        {isAdmin && (
          <Dialog open={isAddStatOpen} onOpenChange={(open) => {
            setIsAddStatOpen(open);
            if (!open) setEditingStat(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="hover-elevate gap-2">
                <PlusCircle className="h-4 w-4" /> Record Season
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle className="text-display text-2xl tracking-wide">
                  {editingStat ? "Edit Stats" : "Record Season Stats"}
                </DialogTitle>
              </DialogHeader>
              <StatForm 
                playerId={player.id} 
                stat={editingStat} 
                onSuccess={() => setIsAddStatOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm overflow-x-auto">
        {sortedStats.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/50 whitespace-nowrap">
              <TableRow>
                <TableHead className="font-bold border-r">Season</TableHead>
                <TableHead className="text-center">GP</TableHead>
                {isQB && <>
                  <TableHead className="text-center border-l bg-muted/30">Pass Yds</TableHead>
                  <TableHead className="text-center bg-muted/30">Pass TDs</TableHead>
                  <TableHead className="text-center bg-muted/30">INTs</TableHead>
                  <TableHead className="text-center bg-muted/30">Comp %</TableHead>
                  <TableHead className="text-center bg-muted/30">Rating</TableHead>
                  <TableHead className="text-center bg-muted/30">Rush Yds</TableHead>
                  <TableHead className="text-center border-r bg-muted/30">Rush TDs</TableHead>
                </>}
                {isRB && <>
                  <TableHead className="text-center border-l bg-muted/30">Rush Yds</TableHead>
                  <TableHead className="text-center bg-muted/30">Carries</TableHead>
                  <TableHead className="text-center bg-muted/30">Yds/Car</TableHead>
                  <TableHead className="text-center bg-muted/30">Yds/Gm</TableHead>
                  <TableHead className="text-center bg-muted/30">Rush TDs</TableHead>
                  <TableHead className="text-center bg-muted/30">Broken Tkl</TableHead>
                  <TableHead className="text-center bg-muted/30">Fum</TableHead>
                  <TableHead className="text-center bg-muted/30">Rec Yds</TableHead>
                  <TableHead className="text-center border-r bg-muted/30">Rec TDs</TableHead>
                </>}
                {isWR && <>
                  <TableHead className="text-center border-l bg-muted/30">Rec Yds</TableHead>
                  <TableHead className="text-center border-r bg-muted/30">Rec TDs</TableHead>
                </>}
                {isDefense && <>
                  <TableHead className="text-center border-l bg-muted/30">Tackles</TableHead>
                  <TableHead className="text-center bg-muted/30">TFL</TableHead>
                  <TableHead className="text-center bg-muted/30">Sacks</TableHead>
                  <TableHead className="text-center border-r bg-muted/30">INTs</TableHead>
                </>}
                {!isQB && !isRB && !isWR && !isDefense && <>
                  <TableHead className="text-center border-l bg-muted/30">Rush Yds</TableHead>
                  <TableHead className="text-center bg-muted/30">Rec Yds</TableHead>
                  <TableHead className="text-center border-r bg-muted/30">TDs</TableHead>
                </>}
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.map((stat) => (
                <TableRow key={stat.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-bold text-display text-lg border-r">{stat.season}</TableCell>
                  <TableCell className="text-center font-medium">{stat.gamesPlayed}</TableCell>
                  
                  {isQB && <>
                    <TableCell className="text-center border-l bg-muted/10 font-mono">{stat.passingYards}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-bold text-primary font-mono">{(stat as any).passingTouchdowns || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-bold text-destructive font-mono">{stat.interceptions || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{((stat as any).completionPercentage || 0).toFixed(1)}%</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{((stat as any).passerRating || 0).toFixed(1)}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{stat.rushingYards}</TableCell>
                    <TableCell className="text-center border-r bg-muted/10 font-bold text-primary font-mono">{(stat as any).rushingTouchdowns || 0}</TableCell>
                  </>}
                  {isRB && <>
                    <TableCell className="text-center border-l bg-muted/10 font-mono">{stat.rushingYards}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{(stat as any).carries || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{Number((stat as any).carries) > 0 ? (Number(stat.rushingYards) / Number((stat as any).carries)).toFixed(1) : '—'}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{Number(stat.gamesPlayed) > 0 ? (Number(stat.rushingYards) / Number(stat.gamesPlayed)).toFixed(1) : '—'}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-bold text-primary font-mono">{(stat as any).rushingTouchdowns || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{(stat as any).brokenTackles || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-bold text-destructive font-mono">{(stat as any).fumbles || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{stat.receivingYards}</TableCell>
                    <TableCell className="text-center border-r bg-muted/10 font-bold text-primary font-mono">{(stat as any).receivingTouchdowns || 0}</TableCell>
                  </>}
                  {isWR && <>
                    <TableCell className="text-center border-l bg-muted/10 font-mono">{stat.receivingYards}</TableCell>
                    <TableCell className="text-center border-r bg-muted/10 font-bold text-primary font-mono">{(stat as any).receivingTouchdowns || 0}</TableCell>
                  </>}
                  {isDefense && <>
                    <TableCell className="text-center border-l bg-muted/10 font-mono">{stat.tackles}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{(stat as any).tacklesForLoss || 0}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{stat.sacks}</TableCell>
                    <TableCell className="text-center border-r bg-muted/10 font-mono">{stat.interceptions}</TableCell>
                  </>}
                  {!isQB && !isRB && !isWR && !isDefense && <>
                    <TableCell className="text-center border-l bg-muted/10 font-mono">{stat.rushingYards}</TableCell>
                    <TableCell className="text-center bg-muted/10 font-mono">{stat.receivingYards}</TableCell>
                    <TableCell className="text-center border-r bg-muted/10 font-bold text-primary font-mono">{stat.touchdowns}</TableCell>
                  </>}
                  
                  {isAdmin && (
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditStat(stat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete season record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete stats for the {stat.season} season?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteStat.mutate({id: stat.id, playerId: player.id})} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <ActivitySquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No stats recorded.</p>
            <p className="text-sm mt-1">Record a season to track player performance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

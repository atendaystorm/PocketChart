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
      label: 'Yards',
      lines: [
        { key: 'Pass', color: 'hsl(var(--chart-1))', name: 'Passing Yds' },
        { key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rushing Yds' },
      ]
    });
    statsToShow.push({
      label: 'Touchdowns & INTs',
      lines: [
        { key: 'PassTDs', color: 'hsl(var(--chart-5))', name: 'Passing TDs' },
        { key: 'RushTDs', color: 'hsl(var(--chart-3))', name: 'Rushing TDs' },
        { key: 'INTs', color: 'hsl(var(--chart-1))', name: 'INTs' },
      ]
    });
    statsToShow.push({
      label: 'Comp % & Passer Rating',
      lines: [
        { key: 'CompPct', color: 'hsl(var(--chart-2))', name: 'Comp %' },
        { key: 'PR', color: 'hsl(var(--chart-4))', name: 'Passer Rating' },
      ]
    });
  } else if (isRB) {
    statsToShow.push({
      label: 'Yards',
      lines: [
        { key: 'Rush', color: 'hsl(var(--chart-2))', name: 'Rushing Yds' },
        { key: 'Rec', color: 'hsl(var(--chart-3))', name: 'Receiving Yds' },
        { key: 'BrokenTackles', color: 'hsl(var(--chart-4))', name: 'Broken Tackles' },
      ]
    });
    statsToShow.push({
      label: 'Touchdowns & Fumbles',
      lines: [
        { key: 'RushTDs', color: 'hsl(var(--chart-5))', name: 'Rushing TDs' },
        { key: 'RecTDs', color: 'hsl(var(--chart-3))', name: 'Receiving TDs' },
        { key: 'Fumbles', color: 'hsl(0 72% 51%)', name: 'Fumbles' },
      ]
    });
    statsToShow.push({
      label: 'Averages',
      lines: [
        { key: 'AvgRushPerGame', color: 'hsl(var(--chart-2))', name: 'Rush Yds/Game' },
        { key: 'AvgYdsPerCarry', color: 'hsl(var(--chart-4))', name: 'Yds/Carry' },
      ]
    });
  } else if (isWR) {
    statsToShow.push({ label: 'Receiving Yards', lines: [{ key: 'Rec', color: 'hsl(var(--chart-3))', name: 'Rec Yds' }] });
    statsToShow.push({ label: 'Receiving TDs', lines: [{ key: 'RecTDs', color: 'hsl(var(--chart-5))', name: 'Rec TDs' }] });
  } else if (isDefense) {
    statsToShow.push({
      label: 'Tackles, TFLs & Sacks',
      lines: [
        { key: 'Tackles', color: 'hsl(var(--chart-4))', name: 'Tackles' },
        { key: 'TFL', color: 'hsl(var(--chart-2))', name: 'TFL' },
        { key: 'Sacks', color: 'hsl(var(--chart-1))', name: 'Sacks' },
      ]
    });
    statsToShow.push({
      label: 'Turnovers & Impact',
      lines: [
        { key: 'INTs', color: 'hsl(var(--chart-3))', name: 'Interceptions' },
        { key: 'PDs', color: 'hsl(var(--chart-5))', name: 'Pass Deflections' },
        { key: 'DefTDs', color: 'hsl(var(--chart-1))', name: 'Def TDs' },
        { key: 'FF', color: 'hsl(var(--chart-2))', name: 'Forced Fumbles' },
        { key: 'FR', color: 'hsl(var(--chart-4))', name: 'Fumble Rec' },
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
      PR: (s as any).passerRating || 0,
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
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge className="px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {player.position}
            </Badge>
            <Badge variant="secondary" className="px-4 py-1 text-sm">
              {(player as any).status === 'Drafted' ? `Drafted (R${(player as any).draftRound} P${(player as any).draftPick})` : (player as any).status}
            </Badge>
            <Badge variant="outline" className="px-4 py-1 text-sm">
              Dev Trait: {(player as any).devTrait || "Normal"}
            </Badge>
            <Badge variant="outline" className="px-4 py-1 text-sm">
              Overall Rating: {(player as any).overallRating || 0}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsToShow.map((chart) => (
            <Card key={chart.label} className="shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-display tracking-wider mb-1 flex items-center gap-2 text-muted-foreground uppercase">
                  <ActivitySquare className="h-4 w-4" /> {chart.label}
                </h3>
                <div className="flex flex-wrap gap-3 mb-3">
                  {chart.lines.map(line => (
                    <span key={line.key} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className="inline-block h-2 w-5 rounded-full" style={{ backgroundColor: line.color }} />
                      {line.name}
                    </span>
                  ))}
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(value: number, key: string) => {
                          const line = chart.lines.find(l => l.key === key);
                          return [value, line?.name ?? key];
                        }}
                      />
                      {chart.lines.map(line => (
                        <Line
                          key={line.key}
                          type="monotone"
                          dataKey={line.key}
                          name={line.name}
                          stroke={line.color}
                          strokeWidth={2.5}
                          dot={{ fill: line.color, r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          animationDuration={1200}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
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

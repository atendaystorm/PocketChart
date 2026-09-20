import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlayerStatSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePlayerStat, useUpdatePlayerStat } from "@/hooks/use-player-stats";
import type { PlayerStat } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { usePlayer } from "@/hooks/use-players";

type StatFormProps = {
  stat?: PlayerStat;
  playerId: number;
  onSuccess: () => void;
};

const formSchema = insertPlayerStatSchema.extend({
  playerId: z.coerce.number(),
  season: z.coerce.number().min(2000).max(2100),
  gamesPlayed: z.coerce.number().min(0).default(0),
  passingYards: z.coerce.number().default(0),
  rushingYards: z.coerce.number().default(0),
  receivingYards: z.coerce.number().default(0),
  touchdowns: z.coerce.number().default(0),
  passingTouchdowns: z.coerce.number().default(0),
  rushingTouchdowns: z.coerce.number().default(0),
  receivingTouchdowns: z.coerce.number().default(0),
  tackles: z.coerce.number().default(0),
  sacks: z.coerce.number().default(0),
  interceptions: z.coerce.number().default(0),
  tacklesForLoss: z.coerce.number().default(0),
  forcedFumbles: z.coerce.number().default(0),
  fumbleRecoveries: z.coerce.number().default(0),
  defensiveTouchdowns: z.coerce.number().default(0),
  passDeflections: z.coerce.number().default(0),
  completionPercentage: z.coerce.number().min(0).max(100).default(0),
  passerRating: z.coerce.number().min(0).default(0),
  carries: z.coerce.number().min(0).default(0),
  brokenTackles: z.coerce.number().min(0).default(0),
  fumbles: z.coerce.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

export function StatForm({ stat, playerId, onSuccess }: StatFormProps) {
  const { data: player } = usePlayer(playerId);
  const createStat = useCreatePlayerStat();
  const updateStat = useUpdatePlayerStat();
  
  const isPending = createStat.isPending || updateStat.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: stat ? {
      playerId: stat.playerId,
      season: stat.season,
      gamesPlayed: stat.gamesPlayed,
      passingYards: stat.passingYards,
      rushingYards: stat.rushingYards,
      receivingYards: stat.receivingYards,
      touchdowns: stat.touchdowns,
      passingTouchdowns: (stat as any).passingTouchdowns || 0,
      rushingTouchdowns: (stat as any).rushingTouchdowns || 0,
      receivingTouchdowns: (stat as any).receivingTouchdowns || 0,
      tackles: stat.tackles,
      sacks: stat.sacks,
      interceptions: stat.interceptions,
      tacklesForLoss: (stat as any).tacklesForLoss || 0,
      forcedFumbles: (stat as any).forcedFumbles || 0,
      fumbleRecoveries: (stat as any).fumbleRecoveries || 0,
      defensiveTouchdowns: (stat as any).defensiveTouchdowns || 0,
      passDeflections: (stat as any).passDeflections || 0,
      completionPercentage: (stat as any).completionPercentage || 0,
      passerRating: (stat as any).passerRating || 0,
      carries: (stat as any).carries || 0,
      brokenTackles: (stat as any).brokenTackles || 0,
      fumbles: (stat as any).fumbles || 0,
    } : {
      playerId: playerId,
      season: new Date().getFullYear(),
      gamesPlayed: 0,
      passingYards: 0,
      rushingYards: 0,
      receivingYards: 0,
      touchdowns: 0,
      passingTouchdowns: 0,
      rushingTouchdowns: 0,
      receivingTouchdowns: 0,
      tackles: 0,
      sacks: 0,
      interceptions: 0,
      tacklesForLoss: 0,
      forcedFumbles: 0,
      fumbleRecoveries: 0,
      defensiveTouchdowns: 0,
      passDeflections: 0,
      completionPercentage: 0,
      passerRating: 0,
      carries: 0,
      brokenTackles: 0,
      fumbles: 0,
    },
  });

  function onSubmit(data: FormValues) {
    if (stat) {
      updateStat.mutate({ id: stat.id, ...data }, { onSuccess });
    } else {
      createStat.mutate(data, { onSuccess });
    }
  }

  const pos = player?.position?.toUpperCase() || "";
  const isQB = pos === "QB";
  const isRB = pos === "RB" || pos === "FB";
  const isSkill = ["WR", "TE"].includes(pos);
  const isOffensivePos = ["QB", "RB", "WR", "TE", "FB", "OL", "OT", "OG", "C"].includes(pos);
  const isDefensivePos = ["LB", "DE", "DT", "CB", "S", "DB", "DL", "EDGE", "SS", "FS"].includes(pos);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season">Season (Year)</Label>
          <Input id="season" type="number" {...form.register("season")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gamesPlayed">Games Played</Label>
          <Input id="gamesPlayed" type="number" {...form.register("gamesPlayed")} />
        </div>
      </div>

      {(isOffensivePos || !pos) && (
        <div className="border-t border-border pt-4 mt-2">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Offensive Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            {isQB && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passingYards">Passing Yds</Label>
                  <Input id="passingYards" type="number" {...form.register("passingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingTouchdowns">Passing TDs</Label>
                  <Input id="passingTouchdowns" type="number" {...form.register("passingTouchdowns")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionPercentage">Comp %</Label>
                  <Input id="completionPercentage" type="number" step="0.1" {...form.register("completionPercentage")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passerRating">Passer Rating</Label>
                  <Input id="passerRating" type="number" step="0.1" {...form.register("passerRating")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interceptions">Interceptions</Label>
                  <Input id="interceptions" type="number" {...form.register("interceptions")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rushingYards">Rushing Yds</Label>
                  <Input id="rushingYards" type="number" {...form.register("rushingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rushingTouchdowns">Rushing TDs</Label>
                  <Input id="rushingTouchdowns" type="number" {...form.register("rushingTouchdowns")} />
                </div>
              </>
            )}

            {isRB && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rushingYards">Rushing Yds</Label>
                  <Input id="rushingYards" type="number" {...form.register("rushingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carries">Carries</Label>
                  <Input id="carries" type="number" {...form.register("carries")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rushingTouchdowns">Rushing TDs</Label>
                  <Input id="rushingTouchdowns" type="number" {...form.register("rushingTouchdowns")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokenTackles">Broken Tackles</Label>
                  <Input id="brokenTackles" type="number" {...form.register("brokenTackles")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fumbles">Fumbles</Label>
                  <Input id="fumbles" type="number" {...form.register("fumbles")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivingYards">Receiving Yds</Label>
                  <Input id="receivingYards" type="number" {...form.register("receivingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivingTouchdowns">Receiving TDs</Label>
                  <Input id="receivingTouchdowns" type="number" {...form.register("receivingTouchdowns")} />
                </div>
              </>
            )}

            {isSkill && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="receivingYards">Receiving Yds</Label>
                  <Input id="receivingYards" type="number" {...form.register("receivingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivingTouchdowns">Receiving TDs</Label>
                  <Input id="receivingTouchdowns" type="number" {...form.register("receivingTouchdowns")} />
                </div>
              </>
            )}

            {!isQB && !isRB && !isSkill && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rushingYards">Rushing Yds</Label>
                  <Input id="rushingYards" type="number" {...form.register("rushingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivingYards">Receiving Yds</Label>
                  <Input id="receivingYards" type="number" {...form.register("receivingYards")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="touchdowns">Touchdowns</Label>
                  <Input id="touchdowns" type="number" {...form.register("touchdowns")} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(isDefensivePos || !pos) && (
        <div className="border-t border-border pt-4 mt-2">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Defensive Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tackles">Total Tackles</Label>
              <Input id="tackles" type="number" {...form.register("tackles")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tacklesForLoss">TFL</Label>
              <Input id="tacklesForLoss" type="number" {...form.register("tacklesForLoss")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sacks">Sacks</Label>
              <Input id="sacks" type="number" {...form.register("sacks")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interceptions">INTs</Label>
              <Input id="interceptions" type="number" {...form.register("interceptions")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passDeflections">Pass Deflections</Label>
              <Input id="passDeflections" type="number" {...form.register("passDeflections")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forcedFumbles">Forced Fumbles</Label>
              <Input id="forcedFumbles" type="number" {...form.register("forcedFumbles")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fumbleRecoveries">Fumble Recoveries</Label>
              <Input id="fumbleRecoveries" type="number" {...form.register("fumbleRecoveries")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defensiveTouchdowns">Defensive TDs</Label>
              <Input id="defensiveTouchdowns" type="number" {...form.register("defensiveTouchdowns")} />
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending} className="font-semibold px-8 hover-elevate">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {stat ? "Save Stats" : "Record Stats"}
        </Button>
      </div>
    </form>
  );
}

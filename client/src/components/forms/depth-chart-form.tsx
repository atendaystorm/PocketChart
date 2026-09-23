import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DEPTH_CHART_POSITIONS,
  PLAYER_CLASS_YEARS,
  type DepthChartEntry,
  type DepthChartPosition,
  type PlayerClassYear,
  type PlayerDevTrait,
} from "@shared/schema";
import { Loader2, Plus, Trash2 } from "lucide-react";

type RosterPlayer = {
  playerName: string;
  classYear: PlayerClassYear;
  overallRating: number;
  isRedshirted: boolean;
  devTrait: PlayerDevTrait;
};

type DepthChartFormProps = {
  teamId: number;
  season?: number;
  entries?: DepthChartEntry[];
  onSuccess: () => void;
};

function buildRoster(entries: DepthChartEntry[]): Record<DepthChartPosition, RosterPlayer[]> {
  const roster = {} as Record<DepthChartPosition, RosterPlayer[]>;
  for (const position of DEPTH_CHART_POSITIONS) {
    roster[position] = entries
      .filter(entry => entry.position === position)
      .map(entry => ({
        playerName: entry.playerName,
        classYear: (entry.classYear || "Freshman") as PlayerClassYear,
        overallRating: entry.overallRating || 0,
        isRedshirted: entry.isRedshirted || false,
        devTrait: (entry.devTrait || "Normal") as PlayerDevTrait,
      }));
  }
  return roster;
}

export function DepthChartForm({ teamId, season: initialSeason, entries = [], onSuccess }: DepthChartFormProps) {
  const [season, setSeason] = useState(initialSeason !== undefined ? String(initialSeason) : "");
  const [roster, setRoster] = useState<Record<DepthChartPosition, RosterPlayer[]>>(() => buildRoster(entries));
  const [error, setError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePlayer = (position: DepthChartPosition, index: number, updates: Partial<RosterPlayer>) => {
    setRoster(current => ({
      ...current,
      [position]: current[position].map((player, playerIndex) =>
        playerIndex === index ? { ...player, ...updates } : player,
      ),
    }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const seasonNumber = Number(season);
      if (!season.trim() || !Number.isInteger(seasonNumber) || seasonNumber < 0) {
        throw new Error("Enter a valid season.");
      }

      const entriesToSave = DEPTH_CHART_POSITIONS.flatMap(position =>
        roster[position]
          .map(player => ({
  position,
  playerName: player.playerName.trim(),
  classYear: player.classYear,
  overallRating: player.overallRating,
  isRedshirted: player.isRedshirted,
  devTrait: player.devTrait,
}))
          .filter(player => player.playerName),
      );

      const response = await apiRequest("POST", `/api/teams/${teamId}/depth-chart`, {
        season: seasonNumber,
        entries: entriesToSave,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "depth-chart"] });
      toast({ title: "Depth chart saved" });
      onSuccess();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        mutation.mutate();
      }}
      className="space-y-5 max-h-[70vh] overflow-y-auto px-1 pb-4"
    >
      <div className="space-y-2">
        <Label htmlFor="depth-chart-season">Roster Year</Label>
        <Input
          id="depth-chart-season"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 2025"
          value={season}
          onChange={event => setSeason(event.target.value)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Add players in depth order and choose each player’s class year.
      </p>

      <div className="space-y-4">
        {DEPTH_CHART_POSITIONS.map(position => (
          <div key={position} className="rounded-xl border border-border/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="font-bold text-primary">{position}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  setRoster(current => ({
                    ...current,
                    [position]: [...current[position], {
                      playerName: "",
                      classYear: "Freshman",
                      overallRating: 0,
                      isRedshirted: false,
                      devTrait: "Normal",
                    }],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Player
              </Button>
            </div>

            {roster[position].length > 0 ? (
              <div className="space-y-2">
                {roster[position].map((player, index) => (
                  <div key={`${position}-${index}`} className="grid grid-cols-[20px_minmax(0,1fr)_76px_126px_110px_76px_40px] items-center gap-2">
                    <span className="w-5 shrink-0 text-sm text-muted-foreground text-center">{index + 1}</span>
                    <div className="flex items-center gap-2 min-w-0">
  <Input
    aria-label={`${position} player ${index + 1}`}
    placeholder="Player name"
    value={player.playerName}
    onChange={event => updatePlayer(position, index, { playerName: event.target.value })}
  />

</div>
                    <Input
                      aria-label={`${position} player ${index + 1} overall rating`}
                      type="number"
                      min="0"
                      max="99"
                      placeholder="OVR"
                      value={player.overallRating || ""}
                      onChange={event => updatePlayer(position, index, { overallRating: Number(event.target.value) || 0 })}
                    />
                    <Select
                      value={player.classYear}
                      onValueChange={value => updatePlayer(position, index, { classYear: value as PlayerClassYear })}
                    >
                      <SelectTrigger className="w-[130px]" aria-label={`${position} player ${index + 1} class year`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAYER_CLASS_YEARS.map(classYear => (
                          <SelectItem key={classYear} value={classYear}>{classYear}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
  value={player.devTrait}
  onValueChange={value =>
    updatePlayer(position, index, {
      devTrait: value as RosterPlayer["devTrait"],
    })
  }
>
  <SelectTrigger className="w-[110px]" aria-label={`${position} player ${index + 1} dev trait`}>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Normal">Normal</SelectItem>
    <SelectItem value="Impact">Impact</SelectItem>
    <SelectItem value="Star">Star</SelectItem>
    <SelectItem value="Elite">Elite</SelectItem>
  </SelectContent>
</Select>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap w-[76px]">
                      <Checkbox
                        checked={player.isRedshirted}
                        onCheckedChange={checked => updatePlayer(position, index, { isRedshirted: checked === true })}
                        aria-label={`${position} player ${index + 1} redshirted`}
                      />
                      <span className="hidden sm:inline">Redshirt</span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${position} player ${index + 1}`}
                      onClick={() =>
                        setRoster(current => ({
                          ...current,
                          [position]: current[position].filter((_, playerIndex) => playerIndex !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No players added at this position.</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={mutation.isPending} className="font-semibold px-6">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Roster
        </Button>
      </div>
    </form>
  );
}
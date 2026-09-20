import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SeasonRecord } from "@shared/schema";
import { Loader2 } from "lucide-react";

type SeasonRecordFormProps = {
  teamId: number;
  record?: SeasonRecord;
  onSuccess: () => void;
};

export function SeasonRecordForm({ teamId, record, onSuccess }: SeasonRecordFormProps) {
  const [season, setSeason] = useState(record ? String(record.season) : "");
  const [wins, setWins] = useState(record ? String(record.wins) : "");
  const [losses, setLosses] = useState(record ? String(record.losses) : "");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const values = {
        season: Number(season),
        wins: Number(wins),
        losses: Number(losses),
      };
      if (
        !season.trim() ||
        !Number.isInteger(values.season) ||
        values.season < 0 ||
        !Number.isInteger(values.wins) ||
        values.wins < 0 ||
        !Number.isInteger(values.losses) ||
        values.losses < 0
      ) {
        throw new Error("Enter a season and non-negative whole numbers for wins and losses.");
      }

      const url = record
        ? `/api/season-records/${record.id}`
        : `/api/teams/${teamId}/season-records`;
      const response = await apiRequest(record ? "PUT" : "POST", url, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "season-records"] });
      toast({ title: record ? "Season record updated" : "Season record added" });
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
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="season">Season</Label>
        <Input
          id="season"
          type="number"
          min="0"
          step="1"
          placeholder="e.g. 2025"
          value={season}
          onChange={(event) => setSeason(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season-wins">Wins</Label>
          <Input
            id="season-wins"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={wins}
            onChange={(event) => setWins(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="season-losses">Losses</Label>
          <Input
            id="season-losses"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={losses}
            onChange={(event) => setLosses(event.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={mutation.isPending} className="font-semibold px-6">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {record ? "Save Record" : "Add Season"}
        </Button>
      </div>
    </form>
  );
}
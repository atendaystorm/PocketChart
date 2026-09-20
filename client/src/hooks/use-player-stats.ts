import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PlayerStatInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreatePlayerStat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: PlayerStatInput) => {
      const validated = api.playerStats.create.input.parse(data);
      const res = await fetch(api.playerStats.create.path, {
        method: api.playerStats.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create stat record");
      return api.playerStats.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, data.playerId] });
      toast({ title: "Season stats recorded!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add stats", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdatePlayerStat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<PlayerStatInput>) => {
      const url = buildUrl(api.playerStats.update.path, { id });
      const res = await fetch(url, {
        method: api.playerStats.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update stat record");
      return api.playerStats.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, data.playerId] });
      toast({ title: "Stats updated successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update stats", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeletePlayerStat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, playerId }: { id: number, playerId: number }) => {
      const url = buildUrl(api.playerStats.delete.path, { id });
      const res = await fetch(url, { method: api.playerStats.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete stat record");
      return { id, playerId };
    },
    onSuccess: ({ playerId }) => {
      queryClient.invalidateQueries({ queryKey: [api.players.get.path, playerId] });
      toast({ title: "Stat record deleted." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete stats", description: error.message, variant: "destructive" });
    }
  });
}

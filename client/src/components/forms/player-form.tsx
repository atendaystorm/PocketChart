import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlayerSchema, playerDevTraitSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePlayer, useUpdatePlayer } from "@/hooks/use-players";
import { useTeams } from "@/hooks/use-teams";
import type { Player } from "@shared/schema";
import { Loader2, Trash2, PlusCircle, Upload, X } from "lucide-react";
import { useRef } from "react";
import { compressImage } from "@/lib/image-utils";
import { Checkbox } from "@/components/ui/checkbox";

type PlayerFormProps = {
  player?: Player;
  teamId?: number;
  onSuccess: () => void;
};

const formSchema = insertPlayerSchema.extend({
  teamId: z.coerce.number().min(1, "Team is required"),
  jerseyNumber: z.coerce.number().min(0).max(99),
  weight: z.coerce.number().optional(),
  draftRound: z.coerce.number().optional(),
  draftPick: z.coerce.number().optional(),
  imageUrl: z.string().optional(),
  accolades: z.array(z.string()).default([]),
  devTrait: playerDevTraitSchema.default("Normal"),
  overallRating: z.coerce.number().int().min(0).max(99),
  isRedshirted: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function PlayerForm({ player, teamId, onSuccess }: PlayerFormProps) {
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const { data: teams } = useTeams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = createPlayer.isPending || updatePlayer.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: player ? {
      teamId: player.teamId,
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber,
      status: (player as any).status || "Graduated",
      draftRound: (player as any).draftRound || 0,
      draftPick: (player as any).draftPick || 0,
      imageUrl: (player as any).imageUrl || "",
      height: player.height || "",
      weight: player.weight || 0,
      accolades: player.accolades || [],
      devTrait: (player as any).devTrait || "Normal",
      overallRating: (player as any).overallRating || 0,
      isRedshirted: (player as any).isRedshirted || false,
    } : {
      teamId: teamId || 0,
      name: "",
      position: "",
      jerseyNumber: 0,
      status: "Graduated",
      draftRound: 0,
      draftPick: 0,
      imageUrl: "",
      height: "",
      weight: 0,
      accolades: [],
      devTrait: "Normal",
      overallRating: 0,
      isRedshirted: false,
    },
  });

  const imageUrl = form.watch("imageUrl");
  const accolades = form.watch("accolades");
  const status = form.watch("status");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, { maxDim: 400, quality: 0.85 });
    form.setValue("imageUrl", dataUrl);
  };

  const clearImage = () => {
    form.setValue("imageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addAccolade = () => form.setValue("accolades", [...accolades, ""]);
  const removeAccolade = (i: number) => form.setValue("accolades", accolades.filter((_, idx) => idx !== i));
  const updateAccolade = (i: number, value: string) => {
    const next = [...accolades];
    next[i] = value;
    form.setValue("accolades", next);
  };

  function onSubmit(data: FormValues) {
    if (player) {
      updatePlayer.mutate({ id: player.id, ...data }, { onSuccess });
    } else {
      createPlayer.mutate(data, { onSuccess });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-4">
      {/* Player Photo */}
      <div className="space-y-2">
        <Label>Player Photo (Optional)</Label>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        {imageUrl ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
            <img src={imageUrl} alt="Player preview" className="h-14 w-14 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Photo uploaded</p>
              <p className="text-xs text-muted-foreground truncate">
                {imageUrl.startsWith("data:") ? "Custom image" : imageUrl}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={clearImage} className="shrink-0 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Tap to upload photo</span>
            <span className="text-xs">PNG, JPG supported</span>
          </button>
        )}
      </div>

      {!teamId && !player && (
        <div className="space-y-2">
          <Label>Select Team</Label>
          <Select
            onValueChange={(val) => form.setValue("teamId", parseInt(val))}
            defaultValue={form.getValues("teamId") ? String(form.getValues("teamId")) : undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Player Name</Label>
        <Input id="name" placeholder="e.g. John Doe" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="space-y-2" >
        <Label htmlFor="position" > Position </Label>
            < Select
onValueChange = {(val) => form.setValue("position", val)}
defaultValue = { form.getValues("position") }
    >
    <SelectTrigger id="position" >
        <SelectValue placeholder="Select position" />
            </SelectTrigger>
            < SelectContent >
            <SelectItem value="QB" > QB </SelectItem>
                < SelectItem value = "RB" > RB </SelectItem>
                    < SelectItem value = "FB" > FB </SelectItem>
                        < SelectItem value = "TE" > TE </SelectItem>
                            < SelectItem value = "WR" > WR </SelectItem>
                                < SelectItem value = "OL" > OL </SelectItem>
                                    < SelectItem value = "DL" > DL </SelectItem>
                                        < SelectItem value = "EDGE" > EDGE </SelectItem>
                                            < SelectItem value = "LB" > LB </SelectItem>
                                                < SelectItem value = "DB" > DB </SelectItem>
                                                    </SelectContent>
                                                    </Select>
                                                    </div>
        <div className="space-y-2">
          <Label htmlFor="jerseyNumber">Jersey #</Label>
          <Input id="jerseyNumber" type="number" {...form.register("jerseyNumber")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(val) => form.setValue("status", val as FormValues["status"])} defaultValue={form.getValues("status")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Graduated">Graduated</SelectItem>
              <SelectItem value="Drafted">Drafted</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="overallRating">Overall Rating</Label>
          <Input id="overallRating" type="number" min="0" max="99" {...form.register("overallRating")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="devTrait">Dev Trait</Label>
        <Select
          onValueChange={(val) => form.setValue("devTrait", val as FormValues["devTrait"])}
          defaultValue={form.getValues("devTrait")}
        >
          <SelectTrigger id="devTrait">
            <SelectValue placeholder="Development trait" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Impact">Impact</SelectItem>
            <SelectItem value="Star">Star</SelectItem>
            <SelectItem value="Elite">Elite Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
        <Checkbox
          id="isRedshirted"
          checked={form.watch("isRedshirted")}
          onCheckedChange={checked => form.setValue("isRedshirted", checked === true)}
        />
        <Label htmlFor="isRedshirted" className="cursor-pointer font-medium">
          Redshirted
        </Label>
      </div>

      {status === "Drafted" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="draftRound">Draft Round</Label>
            <Input id="draftRound" type="number" {...form.register("draftRound")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="draftPick">Draft Pick</Label>
            <Input id="draftPick" type="number" {...form.register("draftPick")} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (e.g. 6-2)</Label>
          <Input id="height" placeholder="6-2" {...form.register("height")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input id="weight" type="number" {...form.register("weight")} />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Awards & Accolades</Label>
        {accolades.map((accolade, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={accolade}
              onChange={(e) => updateAccolade(i, e.target.value)}
              placeholder="e.g. Heisman Trophy, All-American"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeAccolade(i)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addAccolade} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Accolade
        </Button>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending} className="font-semibold px-8 hover-elevate">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {player ? "Save Changes" : "Add Player"}
        </Button>
      </div>
    </form>
  );
}

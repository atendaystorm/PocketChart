import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateTeam } from "@/hooks/use-teams";
import type { TeamDetailResponse } from "@shared/routes";
import { Loader2, Trash2, PlusCircle, Upload, X } from "lucide-react";
import { useRef } from "react";
import { compressImage } from "@/lib/image-utils";

const coachSchema = z.object({
  headCoachName: z.string().optional(),
  coachPhotoUrl: z.string().optional(),
  wins: z.coerce.number().min(0),
  losses: z.coerce.number().min(0),
  coachAwards: z.array(z.string()).default([]),
  coachAccolades: z.array(z.string()).default([]),
  coachRecords: z.array(z.string()).default([]),
});

type CoachFormValues = z.infer<typeof coachSchema>;

type CoachFormProps = {
  team: TeamDetailResponse;
  onSuccess: () => void;
};

export function CoachForm({ team, onSuccess }: CoachFormProps) {
  const updateTeam = useUpdateTeam();
  const coachFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      headCoachName: (team as any).headCoachName || "",
      coachPhotoUrl: (team as any).coachPhotoUrl || "",
      wins: team.wins,
      losses: team.losses,
      coachAwards: [
        ...((team as any).coachAwards || []),
        ...((team as any).coachAccolades || []),
      ],
      coachAccolades: [],
      coachRecords: (team as any).coachRecords || [],
    },
  });

  const coachPhotoUrl = form.watch("coachPhotoUrl");
  const coachAwards = form.watch("coachAwards");
  const coachRecords = form.watch("coachRecords");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, { maxDim: 400, quality: 0.85 });
    form.setValue("coachPhotoUrl", dataUrl);
  };

  const clearPhoto = () => {
    form.setValue("coachPhotoUrl", "");
    if (coachFileInputRef.current) coachFileInputRef.current.value = "";
  };

  const addItem = (key: "coachAwards" | "coachRecords") =>
    form.setValue(key, [...form.getValues(key), ""]);

  const removeItem = (key: "coachAwards" | "coachRecords", i: number) =>
    form.setValue(key, form.getValues(key).filter((_, idx) => idx !== i));

  const updateItem = (key: "coachAwards" | "coachRecords", i: number, val: string) => {
    const next = [...form.getValues(key)];
    next[i] = val;
    form.setValue(key, next);
  };

  function onSubmit(data: CoachFormValues) {
    updateTeam.mutate(
      {
        id: team.id,
        name: team.name,
        mascot: team.mascot,
        conference: team.conference,
        logoUrl: team.logoUrl || "",
        ...data,
      },
      { onSuccess }
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto px-1 pb-4">
      {/* Coach Photo */}
      <div className="space-y-2">
        <Label>Coach Photo</Label>
        <input ref={coachFileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        {coachPhotoUrl ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
            <img src={coachPhotoUrl} alt="Coach" className="h-16 w-16 object-cover rounded-full border-2 border-primary/20" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Photo uploaded</p>
              <p className="text-xs text-muted-foreground truncate">
                {coachPhotoUrl.startsWith("data:") ? "Custom image" : coachPhotoUrl}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={clearPhoto} className="shrink-0 text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coachFileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm font-medium">Tap to upload coach photo</span>
          </button>
        )}
      </div>

      {/* Coach Name */}
      <div className="space-y-2">
        <Label htmlFor="headCoachName">Head Coach Name</Label>
        <Input id="headCoachName" placeholder="e.g. Ryan Day" {...form.register("headCoachName")} />
      </div>

      {/* Career Record */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Career Record</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="career-wins">Wins</Label>
            <Input id="career-wins" type="number" min="0" {...form.register("wins")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career-losses">Losses</Label>
            <Input id="career-losses" type="number" min="0" {...form.register("losses")} />
          </div>
        </div>
      </div>

      {/* Awards & Accolades */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Awards & Accolades</Label>
        {coachAwards.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={e => updateItem("coachAwards", i, e.target.value)} placeholder="e.g. Coach of the Year" />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem("coachAwards", i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addItem("coachAwards")} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Award / Accolade
        </Button>
      </div>

      {/* Records */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Records</Label>
        {coachRecords.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item} onChange={e => updateItem("coachRecords", i, e.target.value)} placeholder="e.g. 100-20 overall" />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem("coachRecords", i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addItem("coachRecords")} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Record
        </Button>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={updateTeam.isPending} className="font-semibold px-8 hover-elevate">
          {updateTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Coach Info
        </Button>
      </div>
    </form>
  );
}

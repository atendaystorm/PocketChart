import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTeam, useUpdateTeam } from "@/hooks/use-teams";
import type { TeamDetailResponse } from "@shared/routes";
import { Loader2, Trash2, PlusCircle, Upload, X } from "lucide-react";
import { useRef } from "react";
import { compressImage } from "@/lib/image-utils";

type TeamFormProps = {
  team?: TeamDetailResponse;
  onSuccess: () => void;
};

const formSchema = insertTeamSchema.omit({
  wins: true,
  losses: true,
}).extend({
  gameTitle: z.string().optional(),
  leagueName: z.string().optional(),
  coachPhotoUrl: z.string().optional(),
  coachAccolades: z.array(z.string()).default([]),
  coachAwards: z.array(z.string()).default([]),
  coachRecords: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export function TeamForm({ team, onSuccess }: TeamFormProps) {
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  
  const isPending = createTeam.isPending || updateTeam.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: team ? {
      name: team.name,
      mascot: team.mascot,
      conference: team.conference,
      logoUrl: team.logoUrl || "",
      gameTitle: (team as any).gameTitle || "",
      leagueName: (team as any).leagueName || "",
      headCoachName: (team as any).headCoachName || "",
      coachPhotoUrl: (team as any).coachPhotoUrl || "",
      coachAccolades: (team as any).coachAccolades || [],
      coachAwards: (team as any).coachAwards || [],
      coachRecords: (team as any).coachRecords || [],
    } : {
      name: "",
      mascot: "",
      conference: "",
      logoUrl: "",
      gameTitle: "",
      leagueName: "",
      headCoachName: "",
      coachPhotoUrl: "",
      coachAccolades: [],
      coachAwards: [],
      coachRecords: [],
    },
  });

  const logoUrl = form.watch("logoUrl");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, { maxDim: 400, quality: 0.85 });
    form.setValue("logoUrl", dataUrl);
  };

  const clearLogo = () => {
    form.setValue("logoUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  function onSubmit(data: FormValues) {
    if (team) {
      updateTeam.mutate({ id: team.id, ...data }, { onSuccess });
    } else {
      createTeam.mutate(data, { onSuccess });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-4">
      <div className="space-y-2">
        <Label htmlFor="name">University Name</Label>
        <Input id="name" placeholder="e.g. Ohio State University" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mascot">Mascot</Label>
          <Input id="mascot" placeholder="e.g. Buckeyes" {...form.register("mascot")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conference">Conference</Label>
          <Input id="conference" placeholder="e.g. Big Ten" {...form.register("conference")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Team Logo (Optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {logoUrl ? (
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
            <img
              src={logoUrl}
              alt="Team logo preview"
              className="h-14 w-14 object-contain rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Logo uploaded</p>
              <p className="text-xs text-muted-foreground truncate">
                {logoUrl.startsWith("data:") ? "Custom image" : logoUrl}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearLogo}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Upload className="h-7 w-7" />
            <span className="text-sm font-medium">Tap to upload logo</span>
            <span className="text-xs">PNG, JPG, SVG supported</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gameTitle">Video Game Title (Optional)</Label>
          <Input id="gameTitle" placeholder="e.g. NCAA Football 14" {...form.register("gameTitle")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leagueName">League Name (Optional)</Label>
          <Input id="leagueName" placeholder="e.g. Dynasty Mode S3" {...form.register("leagueName")} />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isPending} className="font-semibold px-8 hover-elevate">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {team ? "Save Changes" : "Create Team"}
        </Button>
      </div>
    </form>
  );
}

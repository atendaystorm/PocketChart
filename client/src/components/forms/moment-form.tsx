import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-utils";
import type { Moment } from "@shared/schema";

const momentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});
type MomentFormValues = z.infer<typeof momentSchema>;

type Props = {
  teamId: number;
  moment?: Moment;
  onSuccess: () => void;
};

export function MomentForm({ teamId, moment, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>(moment?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const form = useForm<MomentFormValues>({
    resolver: zodResolver(momentSchema),
    defaultValues: {
      title: moment?.title ?? "",
      body: moment?.body ?? "",
    },
  });

  const create = useMutation({
    mutationFn: (data: { title: string; body: string; images: string[] }) =>
      apiRequest("POST", `/api/teams/${teamId}/moments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "moments"] });
      toast({ title: "Moment posted!" });
      onSuccess();
    },
    onError: () => toast({ title: "Failed to post moment", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: (data: { title: string; body: string; images: string[] }) =>
      apiRequest("PUT", `/api/moments/${moment!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "moments"] });
      toast({ title: "Moment updated!" });
      onSuccess();
    },
    onError: () => toast({ title: "Failed to update moment", variant: "destructive" }),
  });

  const isPending = create.isPending || update.isPending;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const compressed = await Promise.all(
        files.map(f => compressImage(f, { maxDim: 1200, quality: 0.85 }))
      );
      setImages(prev => [...prev, ...compressed]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(i: number) {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(data: MomentFormValues) {
    const payload = { ...data, images };
    moment ? update.mutate(payload) : create.mutate(payload);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 pb-4">
      <div className="space-y-2">
        <Label htmlFor="moment-title">Title</Label>
        <Input
          id="moment-title"
          placeholder="e.g. Championship Win — 2024"
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="moment-body">Story</Label>
        <Textarea
          id="moment-body"
          placeholder="Write the story behind this moment..."
          rows={6}
          className="resize-none"
          {...form.register("body")}
        />
        {form.formState.errors.body && (
          <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Photos</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading..." : "Add Photos"}
          </span>
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending} className="font-semibold px-8 hover-elevate">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {moment ? "Save Changes" : "Post Moment"}
        </Button>
      </div>
    </form>
  );
}

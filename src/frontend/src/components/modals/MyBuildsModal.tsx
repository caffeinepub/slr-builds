import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../../contexts/LangContext";
import { useActor } from "../../hooks/useActor";

interface Props {
  onClose: () => void;
}

export function MyBuildsModal({ onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: builds = [], isLoading } = useQuery({
    queryKey: ["myBuilds"],
    queryFn: () => actor!.getMyBuilds(),
    enabled: !!actor,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteBuildById(id),
    onSuccess: () => {
      toast.success(t("Сборка удалена", "Build deleted"));
      queryClient.invalidateQueries({ queryKey: ["myBuilds"] });
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: bigint) => actor!.toggleBuildVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBuilds"] });
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-glow">
            {t("Мои сборки", "My Builds")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : builds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("Нет сборок", "No builds yet")}
            </p>
          ) : (
            <div className="space-y-2">
              {builds.map((build) => (
                <div
                  key={build.id.toString()}
                  className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
                >
                  <div>
                    <p className="font-bold text-sm">{build.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {build.isPublic
                        ? t("Публичная", "Public")
                        : t("Скрытая", "Hidden")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => toggleMutation.mutate(build.id)}
                      title={
                        build.isPublic
                          ? t("Скрыть", "Hide")
                          : t("Показать", "Show")
                      }
                    >
                      {build.isPublic ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(build.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

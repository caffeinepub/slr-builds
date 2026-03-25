import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Hero } from "../../backend";
import { useLang } from "../../contexts/LangContext";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface Props {
  heroes: Hero[];
  onClose: () => void;
}

export function RecordBuildModal({ heroes, onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [heroId, setHeroId] = useState<bigint | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!actor || !identity) return;
    if (!title.trim()) {
      toast.error(t("Введите название", "Enter a title"));
      return;
    }
    if (!heroId) {
      toast.error(t("Выберите героя", "Select a hero"));
      return;
    }
    setSaving(true);
    try {
      await actor.createRecordedBuild({
        id: 0n,
        title: title.trim(),
        heroId,
        authorId: identity.getPrincipal(),
        createdAt: BigInt(Date.now()),
      });
      toast.success(t("Сборка записана!", "Build recorded!"));
      queryClient.invalidateQueries({ queryKey: ["myRecordedBuilds"] });
      onClose();
    } catch {
      toast.error(t("Ошибка", "Error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-glow">
            {t("Запись сборки", "Record Build")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Название", "Title")}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 bg-secondary border-border"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Герой", "Hero")}
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {heroes.map((h) => (
                <button
                  type="button"
                  key={h.id.toString()}
                  onClick={() => setHeroId(h.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded border transition-all ${
                    heroId === h.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {t(
              "Примечание: скриншоты можно добавить через админ-панель",
              "Note: screenshots can be added via the admin panel",
            )}
          </p>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              {t("Отмена", "Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/80 glow-red"
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : null}
              {t("Сохранить", "Save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

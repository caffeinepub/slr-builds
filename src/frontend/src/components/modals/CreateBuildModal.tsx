import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Hero, Skill } from "../../backend";
import { useLang } from "../../contexts/LangContext";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface Props {
  heroes: Hero[];
  skills: Skill[];
  onClose: () => void;
}

export function CreateBuildModal({ heroes, skills, onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [selectedHeroes, setSelectedHeroes] = useState<bigint[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<bigint[]>([]);
  const [forbiddenSkills, setForbiddenSkills] = useState<bigint[]>([]);
  const [hint, setHint] = useState("");
  const [costLeg, setCostLeg] = useState("0");
  const [costRare, setCostRare] = useState("0");
  const [costBasic, setCostBasic] = useState("0");
  const [rounds, setRounds] = useState("0");
  const [saving, setSaving] = useState(false);

  const toggleHero = (id: bigint) =>
    setSelectedHeroes((prev) =>
      prev.includes(id)
        ? prev.filter((h) => h !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );

  const toggleRequired = (id: bigint) =>
    setRequiredSkills((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );

  const toggleForbidden = (id: bigint) =>
    setForbiddenSkills((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );

  const handleSave = async () => {
    if (!actor || !identity) return;
    if (!name.trim()) {
      toast.error(t("Введите название", "Enter a name"));
      return;
    }
    setSaving(true);
    try {
      await actor.createBuild({
        id: 0n,
        name: name.trim(),
        authorId: identity.getPrincipal(),
        heroIds: selectedHeroes,
        requiredSkillIds: requiredSkills,
        forbiddenSkillIds: forbiddenSkills,
        hint,
        costLegendary: BigInt(costLeg || 0),
        costRare: BigInt(costRare || 0),
        costBasic: BigInt(costBasic || 0),
        rounds: BigInt(rounds || 0),
        isPublic: true,
        createdAt: BigInt(Date.now()),
      });
      toast.success(t("Сборка создана!", "Build created!"));
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
      onClose();
    } catch {
      toast.error(t("Ошибка создания", "Create error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-glow">
            {t("Создание сборки", "Create Build")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Название сборки", "Build Name")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-secondary border-border"
              placeholder={t("Введите название...", "Enter name...")}
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Герои (до 5)", "Heroes (up to 5)")} — {selectedHeroes.length}
              /5
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {heroes.map((h) => (
                <Chip
                  key={h.id.toString()}
                  label={h.name}
                  selected={selectedHeroes.includes(h.id)}
                  onClick={() => toggleHero(h.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Обязательные навыки (до 5)", "Required skills (up to 5)")} —{" "}
              {requiredSkills.length}/5
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skills.map((s) => (
                <Chip
                  key={s.id.toString()}
                  label={s.name}
                  selected={requiredSkills.includes(s.id)}
                  onClick={() => toggleRequired(s.id)}
                  color="green"
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Запрещённые навыки (до 5)", "Forbidden skills (up to 5)")} —{" "}
              {forbiddenSkills.length}/5
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {skills.map((s) => (
                <Chip
                  key={s.id.toString()}
                  label={s.name}
                  selected={forbiddenSkills.includes(s.id)}
                  onClick={() => toggleForbidden(s.id)}
                  color="red"
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("Лег.", "Leg.")}
              </Label>
              <Input
                value={costLeg}
                onChange={(e) => setCostLeg(e.target.value)}
                type="number"
                min="0"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("Редк.", "Rare")}
              </Label>
              <Input
                value={costRare}
                onChange={(e) => setCostRare(e.target.value)}
                type="number"
                min="0"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("Баз.", "Basic")}
              </Label>
              <Input
                value={costBasic}
                onChange={(e) => setCostBasic(e.target.value)}
                type="number"
                min="0"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t("Раунды", "Rounds")}
              </Label>
              <Input
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                type="number"
                min="0"
                className="mt-1 bg-secondary border-border"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("Подсказка", "Hint")}
            </Label>
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="mt-1 bg-secondary border-border"
              rows={3}
            />
          </div>

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

function Chip({
  label,
  selected,
  onClick,
  color = "default",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  color?: "default" | "green" | "red";
}) {
  const colors = {
    default: selected
      ? "border-primary bg-primary/20 text-primary"
      : "border-border text-muted-foreground hover:border-primary/50",
    green: selected
      ? "border-green-500 bg-green-500/20 text-green-400"
      : "border-border text-muted-foreground hover:border-green-500/50",
    red: selected
      ? "border-destructive bg-destructive/20 text-destructive"
      : "border-border text-muted-foreground hover:border-destructive/50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-bold rounded border transition-all ${colors[color]}`}
    >
      {label}
    </button>
  );
}

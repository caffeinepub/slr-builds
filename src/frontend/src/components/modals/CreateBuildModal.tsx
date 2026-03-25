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
import { Check, Loader2 } from "lucide-react";
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
  const [heroSearch, setHeroSearch] = useState("");

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

  const filteredHeroes = heroSearch.trim()
    ? heroes.filter((h) =>
        h.name.toLowerCase().includes(heroSearch.toLowerCase()),
      )
    : heroes;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "oklch(0.14 0.04 252)",
          border: "1px solid oklch(0.71 0.16 75 / 0.3)",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-display text-xl uppercase tracking-wide"
            style={{ color: "oklch(0.71 0.16 75)" }}
          >
            {t("Создание сборки", "Create Build")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: "oklch(0.55 0.02 252)" }}
            >
              {t("Название сборки", "Build Name")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              style={{
                background: "oklch(0.19 0.046 252)",
                border: "1px solid oklch(0.71 0.16 75 / 0.3)",
                color: "oklch(0.93 0.008 252)",
              }}
              placeholder={t("Введите название...", "Enter name...")}
            />
          </div>

          {/* Heroes — icon grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                className="text-xs uppercase tracking-wide"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Герои (до 5)", "Heroes (up to 5)")}
              </Label>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.71 0.16 75 / 0.15)",
                  color: "oklch(0.71 0.16 75)",
                  border: "1px solid oklch(0.71 0.16 75 / 0.4)",
                }}
              >
                {selectedHeroes.length}/5
              </span>
            </div>

            {/* Selected heroes preview row */}
            {selectedHeroes.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {selectedHeroes.map((hId) => {
                  const hero = heroes.find((h) => h.id === hId);
                  if (!hero) return null;
                  return (
                    <button
                      key={hero.id.toString()}
                      type="button"
                      onClick={() => toggleHero(hero.id)}
                      className="relative group"
                      title={hero.name}
                    >
                      <img
                        src={hero.imageUrl}
                        alt={hero.name}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover transition-all"
                        style={{
                          border: "2px solid oklch(0.71 0.16 75)",
                          boxShadow: "0 0 10px oklch(0.71 0.16 75 / 0.5)",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='22' fill='%23334155'/%3E%3Ctext x='22' y='27' text-anchor='middle' font-size='16' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "oklch(0.1 0.04 252 / 0.7)" }}
                      >
                        <span className="text-white text-xs font-bold">✕</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hero search */}
            <input
              type="text"
              placeholder="Поиск героя..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-2 outline-none"
              style={{
                background: "oklch(0.19 0.046 252)",
                border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                color: "oklch(0.93 0.008 252)",
              }}
            />

            {/* Hero icon grid */}
            <div
              className="grid gap-2 max-h-52 overflow-y-auto pr-1"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
              }}
            >
              {filteredHeroes.map((hero) => {
                const active = selectedHeroes.includes(hero.id);
                const disabled = !active && selectedHeroes.length >= 5;
                return (
                  <button
                    key={hero.id.toString()}
                    type="button"
                    onClick={() => !disabled && toggleHero(hero.id)}
                    disabled={disabled}
                    title={hero.name}
                    className="flex flex-col items-center gap-1 p-1 rounded-xl transition-all"
                    style={{
                      background: active
                        ? "oklch(0.71 0.16 75 / 0.15)"
                        : "oklch(0.19 0.046 252)",
                      border: active
                        ? "1px solid oklch(0.71 0.16 75)"
                        : "1px solid oklch(0.71 0.16 75 / 0.1)",
                      opacity: disabled ? 0.35 : 1,
                      boxShadow: active
                        ? "0 0 8px oklch(0.71 0.16 75 / 0.4)"
                        : "none",
                    }}
                  >
                    <div className="relative">
                      <img
                        src={hero.imageUrl}
                        alt={hero.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='20' fill='%23334155'/%3E%3Ctext x='20' y='25' text-anchor='middle' font-size='14' fill='%23cbd5e1'%3E%3F%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {active && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: "oklch(0.71 0.16 75)" }}
                        >
                          <Check
                            size={9}
                            style={{ color: "oklch(0.14 0.04 252)" }}
                          />
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[8px] leading-tight text-center line-clamp-2 max-w-[48px]"
                      style={{
                        color: active
                          ? "oklch(0.71 0.16 75)"
                          : "oklch(0.55 0.02 252)",
                      }}
                    >
                      {hero.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                className="text-xs uppercase tracking-wide"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Обязательные навыки (до 5)", "Required skills (up to 5)")}
              </Label>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.3 0.15 150 / 0.2)",
                  color: "oklch(0.7 0.15 150)",
                  border: "1px solid oklch(0.7 0.15 150 / 0.4)",
                }}
              >
                {requiredSkills.length}/5
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <SkillChip
                  key={s.id.toString()}
                  skill={s}
                  selected={requiredSkills.includes(s.id)}
                  onClick={() => toggleRequired(s.id)}
                  color="green"
                />
              ))}
            </div>
          </div>

          {/* Forbidden skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                className="text-xs uppercase tracking-wide"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Запрещённые навыки (до 5)", "Forbidden skills (up to 5)")}
              </Label>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.3 0.15 25 / 0.2)",
                  color: "oklch(0.7 0.15 25)",
                  border: "1px solid oklch(0.7 0.15 25 / 0.4)",
                }}
              >
                {forbiddenSkills.length}/5
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <SkillChip
                  key={s.id.toString()}
                  skill={s}
                  selected={forbiddenSkills.includes(s.id)}
                  onClick={() => toggleForbidden(s.id)}
                  color="red"
                />
              ))}
            </div>
          </div>

          {/* Cost fields */}
          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label
                className="text-xs"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Лег.", "Leg.")}
              </Label>
              <Input
                value={costLeg}
                onChange={(e) => setCostLeg(e.target.value)}
                type="number"
                min="0"
                className="mt-1"
                style={{
                  background: "oklch(0.19 0.046 252)",
                  border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                  color: "oklch(0.93 0.008 252)",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Редк.", "Rare")}
              </Label>
              <Input
                value={costRare}
                onChange={(e) => setCostRare(e.target.value)}
                type="number"
                min="0"
                className="mt-1"
                style={{
                  background: "oklch(0.19 0.046 252)",
                  border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                  color: "oklch(0.93 0.008 252)",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Баз.", "Basic")}
              </Label>
              <Input
                value={costBasic}
                onChange={(e) => setCostBasic(e.target.value)}
                type="number"
                min="0"
                className="mt-1"
                style={{
                  background: "oklch(0.19 0.046 252)",
                  border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                  color: "oklch(0.93 0.008 252)",
                }}
              />
            </div>
            <div>
              <Label
                className="text-xs"
                style={{ color: "oklch(0.55 0.02 252)" }}
              >
                {t("Раунды", "Rounds")}
              </Label>
              <Input
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                type="number"
                min="0"
                className="mt-1"
                style={{
                  background: "oklch(0.19 0.046 252)",
                  border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                  color: "oklch(0.93 0.008 252)",
                }}
              />
            </div>
          </div>

          {/* Hint */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: "oklch(0.55 0.02 252)" }}
            >
              {t("Подсказка", "Hint")}
            </Label>
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="mt-1"
              style={{
                background: "oklch(0.19 0.046 252)",
                border: "1px solid oklch(0.71 0.16 75 / 0.2)",
                color: "oklch(0.93 0.008 252)",
              }}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                border: "1px solid oklch(0.71 0.16 75 / 0.3)",
                color: "oklch(0.55 0.02 252)",
                background: "transparent",
              }}
            >
              {t("Отмена", "Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "oklch(0.71 0.16 75)",
                color: "oklch(0.14 0.04 252)",
                fontWeight: 700,
              }}
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

function SkillChip({
  skill,
  selected,
  onClick,
  color = "default",
}: {
  skill: Skill;
  selected: boolean;
  onClick: () => void;
  color?: "default" | "green" | "red";
}) {
  const borderColor =
    color === "green"
      ? selected
        ? "oklch(0.7 0.15 150)"
        : "oklch(0.7 0.15 150 / 0.2)"
      : color === "red"
        ? selected
          ? "oklch(0.65 0.2 25)"
          : "oklch(0.65 0.2 25 / 0.2)"
        : selected
          ? "oklch(0.71 0.16 75)"
          : "oklch(0.71 0.16 75 / 0.2)";

  const textColor =
    color === "green"
      ? "oklch(0.7 0.15 150)"
      : color === "red"
        ? "oklch(0.65 0.2 25)"
        : "oklch(0.71 0.16 75)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all"
      style={{
        background: selected ? `${textColor}18` : "oklch(0.19 0.046 252)",
        border: `1px solid ${borderColor}`,
        color: selected ? textColor : "oklch(0.55 0.02 252)",
      }}
    >
      {skill.imageUrl && (
        <img
          src={skill.imageUrl}
          alt={skill.name}
          width={14}
          height={14}
          className="w-3.5 h-3.5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {skill.name}
    </button>
  );
}

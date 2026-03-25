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
import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
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

interface SkillCondition {
  ifSkillId: bigint;
  thenSkillId: bigint;
}

interface ExclusionCondition {
  skill1Id: bigint;
  skill2Id: bigint;
}

const GOLD = "oklch(0.71 0.16 75)";
const CARD_BG = "oklch(0.14 0.04 252)";
const INPUT_BG = "oklch(0.19 0.046 252)";
const MUTED = "oklch(0.55 0.02 252)";
const FG = "oklch(0.93 0.008 252)";
const BORDER = "oklch(0.71 0.16 75 / 0.3)";

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

  // Skill conditions
  const [showConditions, setShowConditions] = useState(false);
  const [skillConditions, setSkillConditions] = useState<SkillCondition[]>([]);
  const [showExclusions, setShowExclusions] = useState(false);
  const [exclusionConditions, setExclusionConditions] = useState<
    ExclusionCondition[]
  >([]);

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

  const addCondition = () => {
    if (skills.length < 2) return;
    setSkillConditions((prev) => [
      ...prev,
      { ifSkillId: skills[0].id, thenSkillId: skills[1]?.id ?? skills[0].id },
    ]);
  };

  const removeCondition = (i: number) =>
    setSkillConditions((prev) => prev.filter((_, idx) => idx !== i));

  const updateConditionIf = (i: number, val: string) =>
    setSkillConditions((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ifSkillId: BigInt(val) } : c)),
    );

  const updateConditionThen = (i: number, val: string) =>
    setSkillConditions((prev) =>
      prev.map((c, idx) =>
        idx === i ? { ...c, thenSkillId: BigInt(val) } : c,
      ),
    );

  const addExclusion = () => {
    if (skills.length < 2) return;
    setExclusionConditions((prev) => [
      ...prev,
      { skill1Id: skills[0].id, skill2Id: skills[1]?.id ?? skills[0].id },
    ]);
  };

  const removeExclusion = (i: number) =>
    setExclusionConditions((prev) => prev.filter((_, idx) => idx !== i));

  const updateExclusion1 = (i: number, val: string) =>
    setExclusionConditions((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, skill1Id: BigInt(val) } : c)),
    );

  const updateExclusion2 = (i: number, val: string) =>
    setExclusionConditions((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, skill2Id: BigInt(val) } : c)),
    );

  const handleSave = async () => {
    if (!actor || !identity) return;
    if (!name.trim()) {
      toast.error(t("Введите название", "Enter a name"));
      return;
    }
    setSaving(true);
    try {
      let finalHint = hint;
      if (skillConditions.length > 0) {
        finalHint += `\n[CONDITIONS]:${JSON.stringify(skillConditions.map((c) => ({ ifSkillId: c.ifSkillId.toString(), thenSkillId: c.thenSkillId.toString() })))}`;
      }
      if (exclusionConditions.length > 0) {
        finalHint += `\n[EXCLUSIONS]:${JSON.stringify(exclusionConditions.map((c) => ({ skill1Id: c.skill1Id.toString(), skill2Id: c.skill2Id.toString() })))}`;
      }
      await actor.createBuild({
        id: 0n,
        name: name.trim(),
        authorId: identity.getPrincipal(),
        heroIds: selectedHeroes,
        requiredSkillIds: requiredSkills,
        forbiddenSkillIds: forbiddenSkills,
        hint: finalHint,
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

  const selectStyle = {
    background: INPUT_BG,
    border: `1px solid ${BORDER}`,
    color: FG,
    borderRadius: "0.5rem",
    padding: "4px 8px",
    fontSize: "12px",
    outline: "none",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-display text-xl uppercase tracking-wide"
            style={{ color: GOLD }}
          >
            {t("Создание сборки", "Create Build")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Name */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              {t("Название сборки", "Build Name")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              style={{
                background: INPUT_BG,
                border: `1px solid ${BORDER}`,
                color: FG,
              }}
              placeholder={t("Введите название...", "Enter name...")}
              data-ocid="create_build.input"
            />
          </div>

          {/* Heroes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                className="text-xs uppercase tracking-wide"
                style={{ color: MUTED }}
              >
                {t("Герои (до 5)", "Heroes (up to 5)")}
              </Label>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: `${GOLD}26`,
                  color: GOLD,
                  border: `1px solid ${GOLD}66`,
                }}
              >
                {selectedHeroes.length}/5
              </span>
            </div>

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
                        className="w-11 h-11 rounded-full object-cover"
                        style={{
                          border: `2px solid ${GOLD}`,
                          boxShadow: `0 0 10px ${GOLD}80`,
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='22' fill='%23334155'/%3E%3C/svg%3E";
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

            <input
              type="text"
              placeholder="Поиск героя..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-2 outline-none"
              style={{
                background: INPUT_BG,
                border: `1px solid ${GOLD}33`,
                color: FG,
              }}
            />

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
                      background: active ? `${GOLD}22` : INPUT_BG,
                      border: active
                        ? `1px solid ${GOLD}`
                        : `1px solid ${GOLD}1a`,
                      opacity: disabled ? 0.35 : 1,
                      boxShadow: active ? `0 0 8px ${GOLD}66` : "none",
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
                          style={{ background: GOLD }}
                        >
                          <Check size={9} style={{ color: CARD_BG }} />
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[8px] leading-tight text-center line-clamp-2 max-w-[48px]"
                      style={{ color: active ? GOLD : MUTED }}
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
                style={{ color: MUTED }}
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
                style={{ color: MUTED }}
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
            {[
              { label: t("Лег.", "Leg."), val: costLeg, set: setCostLeg },
              { label: t("Редк.", "Rare"), val: costRare, set: setCostRare },
              { label: t("Баз.", "Basic"), val: costBasic, set: setCostBasic },
              { label: t("Раунды", "Rounds"), val: rounds, set: setRounds },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <Label className="text-xs" style={{ color: MUTED }}>
                  {label}
                </Label>
                <Input
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  type="number"
                  min="0"
                  className="mt-1"
                  style={{
                    background: INPUT_BG,
                    border: `1px solid ${GOLD}33`,
                    color: FG,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Hint */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              {t("Подсказка", "Hint")}
            </Label>
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="mt-1"
              style={{
                background: INPUT_BG,
                border: `1px solid ${GOLD}33`,
                color: FG,
              }}
              rows={3}
            />
          </div>

          {/* Условия навыков */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${GOLD}26` }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors"
              style={{ background: INPUT_BG, color: GOLD }}
              onClick={() => setShowConditions((v) => !v)}
              data-ocid="create_build.toggle"
            >
              <span>Условия навыков</span>
              {showConditions ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {showConditions && (
              <div
                className="px-4 py-3 space-y-2"
                style={{ background: CARD_BG }}
              >
                <p className="text-xs" style={{ color: MUTED }}>
                  Если есть навык → нужен навык
                </p>
                {skillConditions.map((cond, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: conditions have no stable id
                  <div key={`cond-${i}`} className="flex items-center gap-2">
                    <select
                      value={cond.ifSkillId.toString()}
                      onChange={(e) => updateConditionIf(i, e.target.value)}
                      style={selectStyle}
                    >
                      {skills.map((s) => (
                        <option key={s.id.toString()} value={s.id.toString()}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: MUTED }} className="text-xs">
                      →
                    </span>
                    <select
                      value={cond.thenSkillId.toString()}
                      onChange={(e) => updateConditionThen(i, e.target.value)}
                      style={selectStyle}
                    >
                      {skills.map((s) => (
                        <option key={s.id.toString()} value={s.id.toString()}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCondition(i)}
                      style={{ color: "oklch(0.65 0.2 25)" }}
                      className="hover:opacity-80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCondition}
                  disabled={skills.length < 2}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: `${GOLD}1a`,
                    color: GOLD,
                    border: `1px solid ${GOLD}33`,
                  }}
                >
                  + Добавить условие
                </button>
              </div>
            )}
          </div>

          {/* Нельзя вместе */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid oklch(0.65 0.2 25 / 0.25)" }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors"
              style={{ background: INPUT_BG, color: "oklch(0.7 0.15 25)" }}
              onClick={() => setShowExclusions((v) => !v)}
              data-ocid="create_build.toggle"
            >
              <span>Нельзя вместе</span>
              {showExclusions ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {showExclusions && (
              <div
                className="px-4 py-3 space-y-2"
                style={{ background: CARD_BG }}
              >
                <p className="text-xs" style={{ color: MUTED }}>
                  Нельзя чтобы были вместе умения
                </p>
                {exclusionConditions.map((cond, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: exclusions have no stable id
                  <div key={`excl-${i}`} className="flex items-center gap-2">
                    <select
                      value={cond.skill1Id.toString()}
                      onChange={(e) => updateExclusion1(i, e.target.value)}
                      style={selectStyle}
                    >
                      {skills.map((s) => (
                        <option key={s.id.toString()} value={s.id.toString()}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span style={{ color: MUTED }} className="text-xs">
                      ✕
                    </span>
                    <select
                      value={cond.skill2Id.toString()}
                      onChange={(e) => updateExclusion2(i, e.target.value)}
                      style={selectStyle}
                    >
                      {skills.map((s) => (
                        <option key={s.id.toString()} value={s.id.toString()}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeExclusion(i)}
                      style={{ color: "oklch(0.65 0.2 25)" }}
                      className="hover:opacity-80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExclusion}
                  disabled={skills.length < 2}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    background: "oklch(0.65 0.2 25 / 0.1)",
                    color: "oklch(0.7 0.15 25)",
                    border: "1px solid oklch(0.65 0.2 25 / 0.3)",
                  }}
                >
                  + Добавить пару
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                border: `1px solid ${BORDER}`,
                color: MUTED,
                background: "transparent",
              }}
              data-ocid="create_build.cancel_button"
            >
              {t("Отмена", "Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: GOLD, color: CARD_BG, fontWeight: 700 }}
              data-ocid="create_build.submit_button"
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
        color: selected ? textColor : MUTED,
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

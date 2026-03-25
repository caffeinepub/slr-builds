import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Shield, Sword, X } from "lucide-react";
import { useState } from "react";
import type { Build, Hero, Skill } from "../backend";
import { useLang } from "../contexts/LangContext";

interface Props {
  build: Build;
  heroes: Hero[];
  skills: Skill[];
  "data-ocid"?: string;
}

function parseSkillName(name: string, lang: string): string {
  if (name.includes(" / ")) {
    const parts = name.split(" / ");
    return lang === "ru" ? parts[0] : parts[1];
  }
  return name;
}

export function BuildCard({
  build,
  heroes,
  skills,
  "data-ocid": dataOcid,
}: Props) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  const buildHeroes = heroes.filter((h) => build.heroIds.includes(h.id));
  const requiredSkills = skills.filter((s) =>
    build.requiredSkillIds.includes(s.id),
  );
  const forbiddenSkills = skills.filter((s) =>
    build.forbiddenSkillIds.includes(s.id),
  );

  return (
    <>
      <button
        type="button"
        data-ocid={dataOcid}
        className="group relative bg-card border border-border hover:border-primary/50 rounded transition-all duration-200 overflow-hidden hover:glow-red cursor-pointer text-left w-full"
        onClick={() => setExpanded(true)}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent" />

        <div className="p-4">
          {/* Name */}
          <h3 className="font-display font-bold text-base uppercase tracking-wide text-foreground mb-3 line-clamp-1">
            {build.name}
          </h3>

          {/* Heroes */}
          {buildHeroes.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {t("Герои", "Heroes")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {buildHeroes.map((h) => (
                  <span
                    key={h.id.toString()}
                    className="flex items-center gap-1 text-xs bg-secondary border border-border px-2 py-0.5 rounded text-foreground"
                  >
                    {h.imageUrl && (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required skills */}
          {requiredSkills.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-green-400 uppercase tracking-wide mb-1">
                <Sword size={10} />
                {t("Нужны", "Required")}
              </div>
              <div className="flex flex-wrap gap-1">
                {requiredSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-xs border-green-400/30 text-green-400 px-1.5 py-0"
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={12}
                        height={12}
                        className="w-3 h-3 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Forbidden skills */}
          {forbiddenSkills.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-destructive uppercase tracking-wide mb-1">
                <Shield size={10} />
                {t("Запрет", "Forbidden")}
              </div>
              <div className="flex flex-wrap gap-1">
                {forbiddenSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-xs border-destructive/30 text-destructive px-1.5 py-0"
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={12}
                        height={12}
                        className="w-3 h-3 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cost */}
          {(build.costLegendary > 0n ||
            build.costRare > 0n ||
            build.costBasic > 0n) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              <Coins size={10} className="text-accent" />
              {build.costLegendary > 0n && (
                <span className="text-yellow-400">
                  {build.costLegendary.toString()}L
                </span>
              )}
              {build.costRare > 0n && (
                <span className="text-blue-400 ml-1">
                  {build.costRare.toString()}R
                </span>
              )}
              {build.costBasic > 0n && (
                <span className="ml-1">{build.costBasic.toString()}B</span>
              )}
              {build.rounds > 0n && (
                <span className="ml-1 text-accent">
                  {t("Раундов", "Rounds")}: {build.rounds.toString()}
                </span>
              )}
            </div>
          )}

          {/* Hint */}
          {build.hint && (
            <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
              {build.hint}
            </p>
          )}
        </div>
      </button>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="relative w-full max-w-lg bg-black border border-primary/60 rounded overflow-y-auto max-h-[90vh]"
            style={{ boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
          >
            {/* Accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary text-glow pr-4">
                  {build.name}
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(false)}
                  data-ocid="builds.close_button"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Hint */}
              {build.hint && (
                <p className="text-sm text-muted-foreground italic mb-5 border-l-2 border-primary/40 pl-3">
                  {build.hint}
                </p>
              )}

              {/* Heroes */}
              {buildHeroes.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                    {t("Герои", "Heroes")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buildHeroes.map((h) => (
                      <div
                        key={h.id.toString()}
                        className="flex items-center gap-2 bg-secondary border border-border px-2 py-1 rounded"
                      >
                        {h.imageUrl && (
                          <img
                            src={h.imageUrl}
                            alt={h.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required skills */}
              {requiredSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1">
                    <Sword size={12} />{" "}
                    {t("Обязательные навыки", "Required Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-green-400/30 text-green-400 text-xs"
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Forbidden skills */}
              {forbiddenSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1">
                    <Shield size={12} />{" "}
                    {t("Запрещённые навыки", "Forbidden Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {forbiddenSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-destructive/30 text-destructive text-xs"
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost */}
              {(build.costLegendary > 0n ||
                build.costRare > 0n ||
                build.costBasic > 0n) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <Coins size={12} className="inline mr-1 text-accent" />
                    {t("Стоимость", "Cost")}
                  </p>
                  <div className="flex gap-3 text-sm">
                    {build.costLegendary > 0n && (
                      <span className="text-yellow-400">
                        {build.costLegendary.toString()} {t("Легенд.", "Leg.")}
                      </span>
                    )}
                    {build.costRare > 0n && (
                      <span className="text-blue-400">
                        {build.costRare.toString()} {t("Ред.", "Rare")}
                      </span>
                    )}
                    {build.costBasic > 0n && (
                      <span>
                        {build.costBasic.toString()} {t("Баз.", "Basic")}
                      </span>
                    )}
                    {build.rounds > 0n && (
                      <span className="text-accent">
                        {build.rounds.toString()} {t("раундов", "rounds")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Close at bottom */}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => setExpanded(false)}
                >
                  {t("Закрыть", "Close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

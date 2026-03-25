import { Badge } from "@/components/ui/badge";
import { Coins, Shield, Sword } from "lucide-react";
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
  const buildHeroes = heroes.filter((h) => build.heroIds.includes(h.id));
  const requiredSkills = skills.filter((s) =>
    build.requiredSkillIds.includes(s.id),
  );
  const forbiddenSkills = skills.filter((s) =>
    build.forbiddenSkillIds.includes(s.id),
  );

  return (
    <div
      data-ocid={dataOcid}
      className="group relative bg-card border border-border hover:border-primary/50 rounded transition-all duration-200 overflow-hidden hover:glow-red"
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
    </div>
  );
}

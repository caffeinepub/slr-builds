import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2, Plus, Star, Swords, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Build, Skill, TopAuthor } from "../backend";
import { BuildCard } from "../components/BuildCard";
import { TierListTab } from "../components/TierListTab";
import { CreateBuildModal } from "../components/modals/CreateBuildModal";
import { RecordBuildModal } from "../components/modals/RecordBuildModal";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function parseSkillName(name: string, lang: string): string {
  if (name.includes(" / ")) {
    const parts = name.split(" / ");
    return lang === "ru" ? parts[0] : parts[1];
  }
  return name;
}

export function HomePage() {
  const { t, lang } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"builds" | "tierlist">("builds");
  const [selectedSkills, setSelectedSkills] = useState<bigint[]>([]);
  const [showCreateBuild, setShowCreateBuild] = useState(false);
  const [showRecordBuild, setShowRecordBuild] = useState(false);
  const seeded = useRef(false);

  const { data: heroes = [], isLoading: heroesLoading } = useQuery({
    queryKey: ["heroes"],
    queryFn: () => actor!.getAllHeroes(),
    enabled: !!actor,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["skills"],
    queryFn: () => actor!.getAllSkills(),
    enabled: !!actor,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["items"],
    queryFn: () => actor!.getAllItems(),
    enabled: !!actor,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => actor!.getAllBranches(),
    enabled: !!actor,
  });

  const { data: builds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ["publicBuilds", selectedSkills.map(String).join(",")],
    queryFn: () =>
      selectedSkills.length > 0
        ? actor!.getPublicBuildsExcludingSkills(selectedSkills)
        : actor!.getPublicBuilds(),
    enabled: !!actor,
  });

  const { data: topBuildsRaw = [] } = useQuery<Build[]>({
    queryKey: ["topBuilds"],
    queryFn: () => actor!.getTopBuilds(5n),
    enabled: !!actor,
  });

  const { data: topAuthors = [] } = useQuery<TopAuthor[]>({
    queryKey: ["topAuthors"],
    queryFn: () => actor!.getTopAuthors(5n),
    enabled: !!actor,
  });

  // Fallback: if no liked builds yet, show first 5 builds
  const topBuilds = topBuildsRaw.length > 0 ? topBuildsRaw : builds.slice(0, 5);

  useEffect(() => {
    if (actor && !seeded.current && heroes.length === 0 && !heroesLoading) {
      seeded.current = true;
      actor
        .seedTestData()
        .then(() => {
          queryClient.invalidateQueries();
        })
        .catch((err) => {
          console.error("Auto-seed failed:", err);
          seeded.current = false; // allow retry
        });
    }
  }, [actor, heroes.length, heroesLoading, queryClient]);

  const toggleSkill = (id: bigint) => {
    setSelectedSkills((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 5
          ? [...prev, id]
          : prev,
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
        <div
          className="h-48 md:h-64"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.025 25) 0%, oklch(0.09 0.006 252) 50%, oklch(0.12 0.02 42) 100%)",
          }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold uppercase tracking-widest text-glow text-foreground">
            {t("ЛУЧШИЕ СБОРКИ", "TOP BUILDS")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {t(
              "Находите сильные сборки, проверяйте навыки и подбирайте героев",
              "Find strong builds, check skills and pick heroes for battle",
            )}
          </p>
          {isLoggedIn && (
            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                onClick={() => setShowCreateBuild(true)}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-wide glow-red gap-2"
                data-ocid="builds.open_modal_button"
              >
                <Plus size={16} />
                {t("Добавить сборку", "Add Build")}
              </Button>
              <Button
                type="button"
                onClick={() => setShowRecordBuild(true)}
                variant="outline"
                className="border-primary/50 text-foreground gap-2"
                data-ocid="record.open_modal_button"
              >
                <Video size={16} />
                {t("Записать сборку", "Record Build")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-0 mb-8 border-b border-border">
          <TabButton
            active={tab === "builds"}
            onClick={() => setTab("builds")}
            data-ocid="builds.tab"
          >
            <Swords size={16} />
            {t("СБОРКИ", "BUILDS")}
          </TabButton>
          <TabButton
            active={tab === "tierlist"}
            onClick={() => setTab("tierlist")}
            data-ocid="tierlist.tab"
          >
            {t("ТИР-ЛИСТ", "TIER LIST")}
          </TabButton>
        </div>

        {tab === "builds" && (
          <div>
            {/* Top Builds and Top Authors */}
            {(builds.length > 0 || topAuthors.length > 0) && (
              <div className="mb-8 space-y-4">
                {topBuilds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Crown size={14} className="text-yellow-400" />
                      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-yellow-400">
                        {t("ТОП СБОРОК", "TOP BUILDS")}
                      </h2>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <div className="flex gap-3 pb-2">
                        {topBuilds.map((b) => (
                          <TopBuildCard
                            key={b.id.toString()}
                            build={b}
                            heroes={heroes}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {topAuthors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={14} className="text-primary" />
                      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-primary">
                        {t("ТОП АВТОРОВ", "TOP AUTHORS")}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topAuthors.map((a) => (
                        <div
                          key={a.authorId.toString()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-none"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                            {a.authorName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold">
                            {a.authorName}
                          </span>
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 h-4">
                            ♥ {Number(a.totalLikes)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {t(
                    "Выберите до 5 заблокированных навыков:",
                    "Select up to 5 blocked skills:",
                  )}
                  <span className="ml-2 text-primary">
                    {selectedSkills.length}/5
                  </span>
                </h2>
                {selectedSkills.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSkills([])}
                    className="text-muted-foreground text-xs"
                    data-ocid="skills.secondary_button"
                  >
                    {t("Сбросить", "Reset")}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {skills.map((skill) => (
                  <SkillChip
                    key={skill.id.toString()}
                    skill={skill}
                    selected={selectedSkills.includes(skill.id)}
                    onClick={() => toggleSkill(skill.id)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>

            {buildsLoading ? (
              <div
                className="flex justify-center py-20"
                data-ocid="builds.loading_state"
              >
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : builds.length === 0 ? (
              <div
                className="text-center py-20 text-muted-foreground"
                data-ocid="builds.empty_state"
              >
                {t("Сборок не найдено", "No builds found")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {builds.map((build, idx) => (
                  <BuildCard
                    key={build.id.toString()}
                    build={build}
                    heroes={heroes}
                    skills={skills}
                    data-ocid={`builds.item.${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "tierlist" && (
          <TierListTab heroes={heroes} items={items} branches={branches} />
        )}
      </div>

      {showCreateBuild && (
        <CreateBuildModal
          heroes={heroes}
          skills={skills}
          onClose={() => setShowCreateBuild(false)}
        />
      )}
      {showRecordBuild && (
        <RecordBuildModal
          heroes={heroes}
          onClose={() => setShowRecordBuild(false)}
        />
      )}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  "data-ocid": dataOcid,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  "data-ocid"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={dataOcid}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SkillChip({
  skill,
  selected,
  onClick,
  lang,
}: {
  skill: Skill;
  selected: boolean;
  onClick: () => void;
  lang: string;
}) {
  const displayName = parseSkillName(skill.name, lang);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded transition-all border text-center ${
        selected
          ? "border-primary bg-primary/20 text-primary glow-red"
          : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {skill.imageUrl ? (
        <img
          src={skill.imageUrl}
          alt={displayName}
          width={28}
          height={28}
          className="w-7 h-7 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-7 h-7 bg-muted rounded flex items-center justify-center text-xs font-bold">
          {displayName[0]}
        </div>
      )}
      <span className="text-[10px] font-bold uppercase leading-tight line-clamp-2">
        {displayName}
      </span>
    </button>
  );
}

function TopBuildCard({
  build,
  heroes,
}: {
  build: Build;
  heroes: { id: bigint; name: string; imageUrl: string; tier: string }[];
}) {
  const buildHeroes = heroes
    .filter((h) => build.heroIds.includes(h.id))
    .slice(0, 3);
  return (
    <div className="flex-shrink-0 w-48 bg-secondary border border-border rounded-none p-3 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-1 mb-2">
        <Crown size={10} className="text-yellow-400" />
        <span className="text-[10px] font-bold text-yellow-400 uppercase truncate">
          {build.name}
        </span>
      </div>
      {buildHeroes.length > 0 && (
        <div className="flex gap-1 mb-2">
          {buildHeroes.map((h) => (
            <img
              key={h.id.toString()}
              src={h.imageUrl}
              alt={h.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover border border-border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ))}
        </div>
      )}
      {build.hint && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">
          {build.hint}
        </p>
      )}
    </div>
  );
}

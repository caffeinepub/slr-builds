import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Swords, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Skill } from "../backend";
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

  const seedMutation = useMutation({
    mutationFn: () => actor!.seedTestData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const doSeed = useCallback(() => {
    seedMutation.mutate();
  }, [seedMutation.mutate]);

  useEffect(() => {
    if (actor && !seeded.current && heroes.length === 0 && !heroesLoading) {
      seeded.current = true;
      doSeed();
    }
  }, [actor, heroes.length, heroesLoading, doSeed]);

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

            {buildsLoading || seedMutation.isPending ? (
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

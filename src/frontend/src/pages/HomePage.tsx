import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  Swords,
  ThumbsDown,
  ThumbsUp,
  Video,
} from "lucide-react";
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

type TopSection = "top_builds" | "top_authors" | "top_comments";

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
  const [topSection, setTopSection] = useState<TopSection>("top_builds");
  const [selectedTopBuild, setSelectedTopBuild] = useState<Build | null>(null);
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
    queryFn: () => actor!.getTopBuilds(10n),
    enabled: !!actor,
  });

  const { data: topAuthors = [] } = useQuery<TopAuthor[]>({
    queryKey: ["topAuthors"],
    queryFn: () => actor!.getTopAuthors(10n),
    enabled: !!actor,
  });

  const topBuilds =
    topBuildsRaw.length > 0 ? topBuildsRaw : builds.slice(0, 10);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional simplified deps
  useEffect(() => {
    if (!actor || seeded.current || heroesLoading) return;
    if (heroes.length > 0) {
      seeded.current = true;
      return;
    }
    seeded.current = true;
    const runSeed = async () => {
      try {
        await actor.seedSkillsAndBranches();
        await actor.seedHeroes();
        await actor.seedItems();
        await actor.seedBuilds();
        queryClient.invalidateQueries();
      } catch (err) {
        console.error("Auto-seed failed:", err);
        seeded.current = false;
      }
    };
    runSeed();
  }, [actor, heroesLoading]);

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
      <div className="relative overflow-hidden">
        <div
          className="h-56 md:h-72"
          style={{
            backgroundImage: "url('https://say-gg.ru/static/img/bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.14 0.04 252 / 0.2) 0%, oklch(0.14 0.04 252 / 0.6) 70%, oklch(0.14 0.04 252) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, oklch(0.14 0.04 252 / 0.7) 0%, transparent 40%, transparent 60%, oklch(0.14 0.04 252 / 0.7) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <h1
            className="font-display font-bold text-4xl md:text-5xl uppercase tracking-widest mb-2 text-glow"
            style={{ color: "oklch(0.71 0.16 75)" }}
          >
            SAY-GG
          </h1>
          <p className="text-sm text-foreground/70 mb-4 uppercase tracking-widest">
            {t(
              "Skill Legends Royale — Сборки",
              "Skill Legends Royale — Builds",
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Build count — clickable button */}
            <button
              type="button"
              onClick={() => {
                setTab("builds");
                setTopSection("top_builds");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "oklch(0.19 0.046 252 / 0.9)",
                border: "1px solid oklch(0.71 0.16 75 / 0.5)",
                color: "oklch(0.93 0.008 252)",
                boxShadow: "0 0 12px oklch(0.71 0.16 75 / 0.2)",
              }}
            >
              <Swords size={14} style={{ color: "oklch(0.71 0.16 75)" }} />
              <span style={{ color: "oklch(0.71 0.16 75)" }}>Сборок:</span>
              <span className="font-mono">{builds.length}</span>
            </button>

            {/* Telegram */}
            <a
              href="https://t.me/skilllegendsroyale"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "oklch(0.19 0.046 252 / 0.9)",
                border: "1px solid oklch(0.71 0.16 75 / 0.3)",
                color: "oklch(0.93 0.008 252)",
              }}
            >
              📱 Telegram
            </a>

            {isLoggedIn && (
              <>
                <Button
                  size="sm"
                  className="gap-2 rounded-xl font-bold uppercase tracking-wide"
                  style={{
                    background: "oklch(0.71 0.16 75)",
                    color: "oklch(0.14 0.04 252)",
                    boxShadow: "0 0 16px oklch(0.71 0.16 75 / 0.4)",
                  }}
                  onClick={() => setShowCreateBuild(true)}
                  data-ocid="builds.primary_button"
                >
                  <Plus size={16} />
                  {t("Добавить сборку", "Add Build")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-xl font-bold uppercase tracking-wide"
                  style={{
                    border: "1px solid oklch(0.71 0.16 75 / 0.5)",
                    color: "oklch(0.71 0.16 75)",
                    background: "oklch(0.71 0.16 75 / 0.08)",
                  }}
                  onClick={() => setShowRecordBuild(true)}
                  data-ocid="builds.secondary_button"
                >
                  <Video size={16} />
                  {t("Записать сборку", "Record Build")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description card */}
      <div className="container mx-auto px-4 -mt-2 mb-2">
        <div
          className="rounded-xl px-4 py-3 text-sm text-foreground/80"
          style={{
            background: "oklch(0.19 0.046 252 / 0.8)",
            border: "1px solid oklch(0.71 0.16 75 / 0.25)",
          }}
        >
          <span style={{ color: "oklch(0.71 0.16 75)" }} className="font-bold">
            SAY-GG —{" "}
          </span>
          фан-сайт со сборками для Skill Legends Royale. Все сборки добавлены
          сообществом.
        </div>
      </div>

      {/* Tabs + content */}
      <div className="container mx-auto px-4 py-4">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
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
            {/* Top section nav buttons */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              <TopNavBtn
                active={topSection === "top_builds"}
                onClick={() => setTopSection("top_builds")}
              >
                <Crown size={13} />
                Топ сборки
              </TopNavBtn>
              <TopNavBtn
                active={topSection === "top_authors"}
                onClick={() => setTopSection("top_authors")}
              >
                <Star size={13} />
                Топ авторы
              </TopNavBtn>
              <TopNavBtn
                active={topSection === "top_comments"}
                onClick={() => setTopSection("top_comments")}
              >
                <MessageSquare size={13} />
                Топ по комментариям
              </TopNavBtn>
            </div>

            {/* Top section content */}
            {topSection === "top_builds" && (
              <div className="mb-8">
                {topBuilds.length > 0 ? (
                  <div className="overflow-x-auto w-full">
                    <div className="flex gap-3 pb-2">
                      {topBuilds.map((b) => (
                        <TopBuildCard
                          key={b.id.toString()}
                          build={b}
                          heroes={heroes}
                          onClick={() => setSelectedTopBuild(b)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">
                    Нет данных. Загрузите тест-данные в админке.
                  </p>
                )}
              </div>
            )}

            {topSection === "top_authors" && (
              <div className="mb-8">
                {topAuthors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {topAuthors.map((a, idx) => (
                      <div
                        key={a.authorId.toString()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: "oklch(0.19 0.046 252)",
                          border: `1px solid ${idx === 0 ? "oklch(0.71 0.16 75 / 0.7)" : "oklch(0.71 0.16 75 / 0.25)"}`,
                        }}
                      >
                        <span
                          className="text-lg font-black w-6 text-center"
                          style={{
                            color:
                              idx === 0
                                ? "oklch(0.71 0.16 75)"
                                : idx === 1
                                  ? "oklch(0.8 0.05 252)"
                                  : "oklch(0.6 0.05 252)",
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            background: "oklch(0.71 0.16 75 / 0.15)",
                            border: "1px solid oklch(0.71 0.16 75 / 0.4)",
                            color: "oklch(0.71 0.16 75)",
                          }}
                        >
                          {a.authorName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {a.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Number(a.totalLikes)} ♥
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">
                    Данных пока нет.
                  </p>
                )}
              </div>
            )}

            {topSection === "top_comments" && (
              <div className="mb-8">
                {topBuilds.length > 0 ? (
                  <div className="space-y-2">
                    {topBuilds.map((b, idx) => (
                      <button
                        key={b.id.toString()}
                        type="button"
                        onClick={() => setSelectedTopBuild(b)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                        style={{
                          background: "oklch(0.19 0.046 252)",
                          border: "1px solid oklch(0.71 0.16 75 / 0.25)",
                        }}
                      >
                        <span
                          className="text-base font-black w-6 text-center shrink-0"
                          style={{ color: "oklch(0.71 0.16 75)" }}
                        >
                          #{idx + 1}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          {heroes
                            .filter((h) => b.heroIds.includes(h.id))
                            .slice(0, 2)
                            .map((h) => (
                              <img
                                key={h.id.toString()}
                                src={h.imageUrl}
                                alt={h.name}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-bold truncate"
                            style={{ color: "oklch(0.71 0.16 75)" }}
                          >
                            {b.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare size={10} />
                            Открыть
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">
                    Нет данных.
                  </p>
                )}
              </div>
            )}

            {/* Skill filter */}
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
                    className="text-muted-foreground text-xs rounded-lg"
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

      {/* Footer */}
      <footer
        className="mt-16 border-t py-6 text-center text-xs text-muted-foreground"
        style={{ borderColor: "oklch(0.71 0.16 75 / 0.2)" }}
      >
        <p>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
          {" · "}
          <span style={{ color: "oklch(0.71 0.16 75)" }}>
            Powered by SLR Community
          </span>
        </p>
      </footer>

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

      {/* Selected top build expanded modal */}
      {selectedTopBuild && (
        <BuildCard
          build={selectedTopBuild}
          heroes={heroes}
          skills={skills}
          defaultExpanded
          onClose={() => setSelectedTopBuild(null)}
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
      className="flex items-center gap-2 flex-1 justify-center px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all rounded-xl"
      style={
        active
          ? {
              background: "oklch(0.71 0.16 75)",
              color: "oklch(0.14 0.04 252)",
              boxShadow: "0 0 16px oklch(0.71 0.16 75 / 0.4)",
            }
          : {
              background: "oklch(0.19 0.046 252)",
              color: "oklch(0.55 0.02 252)",
              border: "1px solid oklch(0.71 0.16 75 / 0.2)",
            }
      }
    >
      {children}
    </button>
  );
}

function TopNavBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all"
      style={
        active
          ? {
              background: "oklch(0.71 0.16 75 / 0.2)",
              border: "1px solid oklch(0.71 0.16 75)",
              color: "oklch(0.71 0.16 75)",
              boxShadow: "0 0 10px oklch(0.71 0.16 75 / 0.3)",
            }
          : {
              background: "oklch(0.19 0.046 252)",
              border: "1px solid oklch(0.71 0.16 75 / 0.2)",
              color: "oklch(0.55 0.02 252)",
            }
      }
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
      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center relative"
      style={
        selected
          ? {
              background: "oklch(0.71 0.16 75 / 0.2)",
              border: "1px solid oklch(0.71 0.16 75)",
              color: "oklch(0.71 0.16 75)",
              boxShadow: "0 0 10px oklch(0.71 0.16 75 / 0.3)",
            }
          : {
              background: "oklch(0.19 0.046 252)",
              border: "1px solid oklch(0.71 0.16 75 / 0.15)",
              color: "oklch(0.55 0.02 252)",
            }
      }
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
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: "oklch(0.22 0.052 252)" }}
        >
          ?
        </div>
      )}
      <span className="text-[9px] leading-tight line-clamp-2">
        {displayName}
      </span>
      {selected && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: "oklch(0.71 0.16 75)" }}
        />
      )}
    </button>
  );
}

function TopBuildCard({
  build,
  heroes,
  onClick,
}: {
  build: Build;
  heroes: { id: bigint; name: string; imageUrl: string }[];
  onClick: () => void;
}) {
  const { actor } = useActor();
  const buildHeroes = heroes.filter((h) => build.heroIds.includes(h.id));

  const { data: votes } = useQuery({
    queryKey: ["buildVotes", build.id.toString()],
    queryFn: () => actor!.getBuildVotes(build.id),
    enabled: !!actor,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", build.id.toString()],
    queryFn: () => actor!.getBuildComments(build.id),
    enabled: !!actor,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-40 rounded-xl p-3 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        background: "oklch(0.19 0.046 252)",
        border: "1px solid oklch(0.71 0.16 75 / 0.35)",
        boxShadow: "0 2px 12px oklch(0.71 0.16 75 / 0.1)",
      }}
    >
      <div className="flex gap-1 mb-2">
        {buildHeroes.slice(0, 3).map((h) => (
          <img
            key={h.id.toString()}
            src={h.imageUrl}
            alt={h.name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ))}
      </div>
      <p
        className="text-xs font-bold line-clamp-2 leading-tight mb-2"
        style={{ color: "oklch(0.71 0.16 75)" }}
      >
        {build.name}
      </p>
      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-0.5 text-[10px] text-green-400">
          <ThumbsUp size={9} />
          {Number(votes?.likes ?? 0)}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-red-400">
          <ThumbsDown size={9} />
          {Number(votes?.dislikes ?? 0)}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <MessageSquare size={9} />
          {comments.length}
        </span>
      </div>
    </button>
  );
}

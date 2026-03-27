import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronUp,
  Crown,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Star,
  Swords,
  ThumbsDown,
  ThumbsUp,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
type SortMode = "newest" | "popular" | "alpha";
type ViewMode = "dashboard" | "allBuilds";

export function HomePage() {
  const { t, lang } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"builds" | "tierlist">("builds");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [tipExpanded, setTipExpanded] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const [selectedSkills, setSelectedSkills] = useState<bigint[]>([]);
  const [showCreateBuild, setShowCreateBuild] = useState(false);
  const [showRecordBuild, setShowRecordBuild] = useState(false);
  const [topSection, setTopSection] = useState<TopSection>("top_builds");
  const [selectedTopBuild, setSelectedTopBuild] = useState<Build | null>(null);
  const seeded = useRef(false);

  // All builds view state
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [searchText, setSearchText] = useState("");
  const [selectedHeroes, setSelectedHeroes] = useState<bigint[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [allBuildsSkills, setAllBuildsSkills] = useState<bigint[]>([]);

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

  const { data: allBuildsRaw = [], isLoading: allBuildsLoading } = useQuery({
    queryKey: ["allPublicBuilds"],
    queryFn: () => actor!.getPublicBuilds(),
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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        await actor.seedItemsA();
        await new Promise((r) => setTimeout(r, 500));
        await actor.seedItemsB();
        await new Promise((r) => setTimeout(r, 500));
        await actor.seedBuildsA();
        await new Promise((r) => setTimeout(r, 500));
        await actor.seedBuildsB();
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

  const toggleAllBuildsSkill = (id: bigint) => {
    setAllBuildsSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleHeroFilter = (id: bigint) => {
    setSelectedHeroes((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  // Filtered + sorted builds for allBuilds view
  const filteredBuilds = useMemo(() => {
    let list = [...allBuildsRaw];

    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    // Hero filter
    if (selectedHeroes.length > 0) {
      list = list.filter((b) =>
        selectedHeroes.some((hId) => b.heroIds.includes(hId)),
      );
    }

    // Skill filter
    if (allBuildsSkills.length > 0) {
      list = list.filter(
        (b) => !allBuildsSkills.some((sId) => b.requiredSkillIds.includes(sId)),
      );
    }

    // Sort
    if (sortMode === "newest") {
      list = list.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sortMode === "popular") {
      const topIds = topBuilds.map((b) => b.id.toString());
      list = list.sort((a, b) => {
        const ai = topIds.indexOf(a.id.toString());
        const bi = topIds.indexOf(b.id.toString());
        if (ai === -1 && bi === -1) return Number(b.id) - Number(a.id);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    } else if (sortMode === "alpha") {
      list = list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    return list;
  }, [
    allBuildsRaw,
    searchText,
    selectedHeroes,
    allBuildsSkills,
    sortMode,
    topBuilds,
  ]);

  const openAllBuilds = () => {
    setViewMode("allBuilds");
    setSearchText("");
    setSelectedHeroes([]);
    setAllBuildsSkills([]);
    setSortMode("newest");
  };

  const handleHeroClick = (heroId: bigint) => {
    setSelectedTopBuild(null);
    setViewMode("allBuilds");
    setSelectedHeroes([heroId]);
    setSearchText("");
    setAllBuildsSkills([]);
    setSortMode("newest");
    setTab("builds");
  };

  if (viewMode === "allBuilds") {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div
          className="sticky top-0 z-30 border-b px-4 py-3"
          style={{
            background: "oklch(0.98 0.005 240)",
            borderColor: "oklch(0.88 0.01 240)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="container mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("dashboard")}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                color: "oklch(0.55 0.18 45)",
              }}
              data-ocid="builds.secondary_button"
            >
              <ArrowLeft size={14} />
              На главную
            </button>
            <h1
              className="font-display text-lg font-bold uppercase tracking-widest"
              style={{ color: "oklch(0.55 0.18 45)" }}
            >
              Все сборки
            </h1>
            <Badge
              className="rounded font-mono"
              style={{
                background: "oklch(0.55 0.18 45 / 0.1)",
                border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                color: "oklch(0.55 0.18 45)",
              }}
            >
              {filteredBuilds.length} / {allBuildsRaw.length}
            </Badge>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "oklch(0.55 0.18 45 / 0.5)" }}
            />
            <input
              type="text"
              placeholder="Поиск по названию сборки..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-9 py-3 rounded text-sm outline-none transition-all"
              style={{
                background: "oklch(1 0 0)",
                border: `1px solid ${searchText ? "oklch(0.55 0.18 45 / 0.6)" : "oklch(0.55 0.18 45 / 0.15)"}`,
                color: "oklch(0.15 0.01 240)",
                boxShadow: searchText
                  ? "0 2px 8px oklch(0 0 0 / 0.08)"
                  : "none",
              }}
              data-ocid="builds.search_input"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "oklch(0.5 0.02 240)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort tabs */}
          <div className="flex gap-2">
            {(
              [
                { key: "newest", label: "Новые" },
                { key: "popular", label: "Популярные" },
                { key: "alpha", label: "По алфавиту" },
              ] as { key: SortMode; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSortMode(s.key)}
                className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wide transition-all"
                style={
                  sortMode === s.key
                    ? {
                        background: "oklch(0.55 0.18 45 / 0.15)",
                        border: "1px solid oklch(0.72 0.19 40)",
                        color: "oklch(0.55 0.18 45)",
                        boxShadow: "0 2px 8px oklch(0.55 0.18 45 / 0.2)",
                      }
                    : {
                        background: "oklch(1 0 0)",
                        border: "1px solid oklch(0.72 0.19 40 / 0.2)",
                        color: "oklch(0.5 0.02 240)",
                      }
                }
                data-ocid="builds.tab"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Hero filter */}
          {heroes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "oklch(0.5 0.02 240)" }}
                >
                  Герои
                </span>
                {selectedHeroes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedHeroes([])}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "oklch(0.55 0.18 45 / 0.08)",
                      border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                      color: "oklch(0.55 0.18 45)",
                    }}
                  >
                    Сбросить ({selectedHeroes.length})
                  </button>
                )}
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {heroes.map((hero) => {
                  const active = selectedHeroes.includes(hero.id);
                  return (
                    <button
                      key={hero.id.toString()}
                      type="button"
                      onClick={() => toggleHeroFilter(hero.id)}
                      className="shrink-0 flex flex-col items-center gap-1 px-2 pt-2 pb-1.5 rounded text-center transition-all hover:scale-105"
                      style={
                        active
                          ? {
                              background: "oklch(0.55 0.18 45 / 0.15)",
                              border: "1px solid oklch(0.72 0.19 40)",
                              color: "oklch(0.55 0.18 45)",
                              boxShadow: "0 2px 8px oklch(0.55 0.18 45 / 0.2)",
                            }
                          : {
                              background: "oklch(1 0 0)",
                              border: "1px solid oklch(0.72 0.19 40 / 0.15)",
                              color: "oklch(0.5 0.02 240)",
                            }
                      }
                    >
                      <img
                        src={hero.imageUrl}
                        alt={hero.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-[9px] leading-tight max-w-[48px] line-clamp-2">
                        {hero.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skill exclusion filter */}
          {skills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "oklch(0.5 0.02 240)" }}
                >
                  Исключить навыки
                </span>
                {allBuildsSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAllBuildsSkills([])}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "oklch(0.55 0.18 45 / 0.08)",
                      border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                      color: "oklch(0.55 0.18 45)",
                    }}
                  >
                    Сбросить ({allBuildsSkills.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 xl:grid-cols-14 gap-2">
                {skills.map((skill) => (
                  <SkillChip
                    key={skill.id.toString()}
                    skill={skill}
                    selected={allBuildsSkills.includes(skill.id)}
                    onClick={() => toggleAllBuildsSkill(skill.id)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results grid */}
          {allBuildsLoading ? (
            <div
              className="flex justify-center py-20"
              data-ocid="builds.loading_state"
            >
              <Loader2
                className="animate-spin"
                size={32}
                style={{ color: "oklch(0.55 0.18 45)" }}
              />
            </div>
          ) : filteredBuilds.length === 0 ? (
            <div
              className="text-center py-20 rounded"
              style={{
                background: "oklch(1 0 0)",
                border: "1px solid oklch(0.72 0.19 40 / 0.15)",
                color: "oklch(0.5 0.02 240)",
              }}
              data-ocid="builds.empty_state"
            >
              <Swords size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Сборки не найдены</p>
              <p className="text-xs mt-1 opacity-70">
                Попробуйте изменить фильтры
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBuilds.map((build, idx) => (
                <BuildCard
                  key={build.id.toString()}
                  build={build}
                  heroes={heroes}
                  skills={skills}
                  onHeroClick={handleHeroClick}
                  data-ocid={`builds.item.${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className="mt-16 border-t py-6 text-center text-xs text-muted-foreground"
          style={{ borderColor: "oklch(0.88 0.01 240)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <a
              href="https://internetcomputer.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "#3B00B9" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="50" cy="50" r="50" fill="#3B00B9" />
                <path
                  d="M26 50c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S26 58.8 26 50zm32 0c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S58 58.8 58 50z"
                  fill="white"
                  opacity="0.4"
                />
                <path
                  d="M50 38c6.6 0 12 5.4 12 12s-5.4 12-12 12-12-5.4-12-12 5.4-12 12-12z"
                  fill="white"
                />
              </svg>
              Работает на Internet Computer
            </a>
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
              <span style={{ color: "oklch(0.55 0.18 45)" }}>
                Powered by SLR Community
              </span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

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
                "linear-gradient(to bottom, oklch(0.14 0.04 252 / 0.2) 0%, oklch(0.14 0.04 252 / 0.6) 70%, oklch(0.98 0.005 240) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, oklch(0.14 0.04 252 / 0.5) 0%, transparent 40%, transparent 60%, oklch(0.14 0.04 252 / 0.5) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <h1
            className="font-display font-bold text-4xl md:text-5xl uppercase tracking-widest mb-2 text-glow"
            style={{ color: "oklch(0.55 0.18 45)" }}
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
              onClick={openAllBuilds}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "oklch(1 0 0 / 0.9)",
                border: "1px solid oklch(0.72 0.19 40 / 0.5)",
                color: "oklch(0.15 0.01 240)",
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.08)",
              }}
              data-ocid="builds.primary_button"
            >
              <Swords size={14} style={{ color: "oklch(0.55 0.18 45)" }} />
              <span style={{ color: "oklch(0.55 0.18 45)" }}>Сборок:</span>
              <span className="font-mono">{allBuildsRaw.length}</span>
            </button>

            {/* Telegram */}
            <a
              href="https://t.me/skilllegendsroyale"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all hover:scale-105"
              style={{
                background: "oklch(1 0 0 / 0.9)",
                border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                color: "oklch(0.15 0.01 240)",
              }}
            >
              📱 Telegram
            </a>

            {isLoggedIn && (
              <>
                <Button
                  size="sm"
                  className="gap-2 rounded font-bold uppercase tracking-wide"
                  style={{
                    background: "oklch(0.55 0.18 45)",
                    color: "oklch(1 0 0)",
                    boxShadow: "0 4px 12px oklch(0.55 0.18 45 / 0.25)",
                  }}
                  onClick={() => setShowCreateBuild(true)}
                  data-ocid="builds.secondary_button"
                >
                  <Plus size={16} />
                  {t("Добавить сборку", "Add Build")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded font-bold uppercase tracking-wide"
                  style={{
                    border: "1px solid oklch(0.72 0.19 40 / 0.5)",
                    color: "oklch(0.55 0.18 45)",
                    background: "oklch(0.55 0.18 45 / 0.06)",
                  }}
                  onClick={() => setShowRecordBuild(true)}
                >
                  <Video size={16} />
                  {t("Записать сборку", "Record Build")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar — inline, не перекрывает интерфейс */}
      {heroes.length > 0 && (
        <div className="flex justify-center gap-2 py-1.5 px-4">
          {[
            { icon: "🛡", count: heroes.length, label: "Героев" },
            { icon: "📦", count: items.length, label: "Предметов" },
            { icon: "⚔", count: allBuildsRaw.length, label: "Сборок" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: "oklch(1 0 0 / 0.9)",
                border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                color: "oklch(0.15 0.01 240)",
              }}
            >
              <span>{stat.icon}</span>
              <span
                style={{ color: "oklch(0.55 0.18 45)" }}
                className="font-mono"
              >
                {stat.count}
              </span>
              <span className="text-foreground/60">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Description card */}
      <div className="container mx-auto px-4 -mt-2 mb-2">
        <div
          className="rounded px-4 py-3 text-sm text-foreground/80"
          style={{
            background: "oklch(0.10 0.015 240 / 0.8)",
            border: "1px solid oklch(0.72 0.19 40 / 0.2)",
          }}
        >
          <span style={{ color: "oklch(0.55 0.18 45)" }} className="font-bold">
            SAY-GG —{" "}
          </span>
          фан-сайт со сборками для Skill Legends Royale. Все сборки добавлены
          сообществом.
        </div>
      </div>

      {/* Daily Tip widget */}
      {(() => {
        const tips = [
          "Блокируй навыки противника перед составлением сборки — это увеличивает шансы на победу",
          "Герои с высоким уроном хорошо работают в паре с поддержкой",
          "Редкие предметы дают больше синергий — собирай их в первую очередь",
          "Изучи тир-лист перед каждым матчем — мета меняется с каждым патчем",
          "Сборки с ЯРОСТЬ + КРИТ дают максимальный урон на первых раундах",
          "Не забывай обновлять свою сборку после каждого патча",
          "ИСЦЕЛЕНИЕ отлично работает с персонажами ближнего боя",
          "Используй ЩИТ для защиты на поздних стадиях игры",
          "Сборки сообщества часто содержат неочевидные комбинации — изучай их",
          "ЯД эффективен против противников с большим количеством ХП",
          "ЗАМОРОЗКА даёт время для нанесения урона безопасно",
          "ДОДЖ лучше всего работает у быстрых героев",
          "УСКОРЕНИЕ + атакующие навыки = летальная комбинация",
          "Смотри на сборки топ-игроков и адаптируй их под свой стиль",
          "СПРАЙТ навык хорошо усиливает магические атаки",
        ];
        const tip = tips[new Date().getDate() % tips.length];
        return (
          <div className="container mx-auto px-4 mb-3">
            <div
              className="rounded overflow-hidden"
              style={{
                border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                background: "oklch(1 0 0 / 0.9)",
              }}
            >
              <button
                type="button"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
                onClick={() => setTipExpanded((v) => !v)}
                style={{ color: "oklch(0.55 0.18 45)" }}
              >
                <span className="text-base">💡</span>
                <span className="font-bold text-sm uppercase tracking-widest flex-1">
                  Совет дня
                </span>
                <ChevronUp
                  size={14}
                  className="transition-transform duration-200"
                  style={{
                    transform: tipExpanded ? "rotate(0deg)" : "rotate(180deg)",
                  }}
                />
              </button>
              {tipExpanded && (
                <div
                  className="px-4 pb-3 text-sm"
                  style={{ color: "oklch(0.93 0.008 252 / 0.85)" }}
                >
                  {tip}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Scroll to top FAB */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-24 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-200"
        style={{
          background: "oklch(0.55 0.18 45)",
          color: "oklch(1 0 0)",
          opacity: showScrollTop ? 1 : 0,
          pointerEvents: showScrollTop ? "auto" : "none",
          transform: showScrollTop ? "scale(1)" : "scale(0.8)",
          boxShadow: "0 4px 16px oklch(0.55 0.18 45 / 0.35)",
        }}
        aria-label="Наверх"
        data-ocid="page.button"
      >
        <ChevronUp size={20} />
      </button>

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
            <div
              className="flex gap-2 mb-6 overflow-x-auto pb-1"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
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
                  <div
                    className="overflow-x-auto w-full"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
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
                        className="flex items-center gap-3 px-4 py-3 rounded"
                        style={{
                          background: "oklch(1 0 0)",
                          border: `1px solid ${idx === 0 ? "oklch(0.55 0.18 45 / 0.6)" : "oklch(0.55 0.18 45 / 0.15)"}`,
                        }}
                      >
                        <span
                          className="text-lg font-black w-6 text-center"
                          style={{
                            color:
                              idx === 0
                                ? "oklch(0.55 0.18 45)"
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
                            background: "oklch(0.55 0.18 45 / 0.1)",
                            border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                            color: "oklch(0.55 0.18 45)",
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
                        className="w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all hover:scale-[1.01]"
                        style={{
                          background: "oklch(1 0 0)",
                          border: "1px solid oklch(0.72 0.19 40 / 0.2)",
                        }}
                      >
                        <span
                          className="text-base font-black w-6 text-center shrink-0"
                          style={{ color: "oklch(0.55 0.18 45)" }}
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
                            style={{ color: "oklch(0.55 0.18 45)" }}
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
                    className="text-muted-foreground text-xs rounded"
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
                    onHeroClick={handleHeroClick}
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
        style={{ borderColor: "oklch(0.88 0.01 240)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://internetcomputer.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "#3B00B9" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="50" fill="#3B00B9" />
              <path
                d="M26 50c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S26 58.8 26 50zm32 0c0-8.8 7.2-16 16-16s16 7.2 16 16-7.2 16-16 16S58 58.8 58 50z"
                fill="white"
                opacity="0.4"
              />
              <path
                d="M50 38c6.6 0 12 5.4 12 12s-5.4 12-12 12-12-5.4-12-12 5.4-12 12-12z"
                fill="white"
              />
            </svg>
            Работает на Internet Computer
          </a>
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
            <span style={{ color: "oklch(0.55 0.18 45)" }}>
              Powered by SLR Community
            </span>
          </p>
        </div>
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
          onHeroClick={handleHeroClick}
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
      className="flex items-center gap-2 flex-1 justify-center px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all rounded"
      style={
        active
          ? {
              background: "oklch(0.55 0.18 45)",
              color: "oklch(1 0 0)",
              boxShadow: "0 4px 12px oklch(0.55 0.18 45 / 0.25)",
            }
          : {
              background: "oklch(1 0 0)",
              color: "oklch(0.5 0.02 240)",
              border: "1px solid oklch(0.72 0.19 40 / 0.2)",
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
      className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all"
      style={
        active
          ? {
              background: "oklch(0.55 0.18 45 / 0.15)",
              border: "1px solid oklch(0.72 0.19 40)",
              color: "oklch(0.55 0.18 45)",
              boxShadow: "0 2px 8px oklch(0.55 0.18 45 / 0.2)",
            }
          : {
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.72 0.19 40 / 0.2)",
              color: "oklch(0.5 0.02 240)",
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
      className="flex flex-col items-center gap-1 p-2 rounded transition-all text-center relative"
      style={
        selected
          ? {
              background: "oklch(0.55 0.18 45 / 0.15)",
              border: "1px solid oklch(0.72 0.19 40)",
              color: "oklch(0.55 0.18 45)",
              boxShadow: "0 2px 8px oklch(0.55 0.18 45 / 0.2)",
            }
          : {
              background: "oklch(1 0 0)",
              border: "1px solid oklch(0.72 0.19 40 / 0.15)",
              color: "oklch(0.5 0.02 240)",
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
          className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: "oklch(0.13 0.02 240)" }}
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
          style={{ background: "oklch(0.55 0.18 45)" }}
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
      className="shrink-0 w-40 rounded p-3 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer"
      style={{
        background: "oklch(1 0 0)",
        border: "1px solid oklch(0.71 0.16 75 / 0.35)",
        boxShadow: "0 2px 12px oklch(0.72 0.19 40 / 0.1)",
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
        style={{ color: "oklch(0.55 0.18 45)" }}
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

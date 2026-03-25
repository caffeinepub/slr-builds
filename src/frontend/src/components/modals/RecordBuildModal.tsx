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
import { Check, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Hero } from "../../backend";
import { useLang } from "../../contexts/LangContext";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface Props {
  heroes: Hero[];
  onClose: () => void;
}

const CARD_BG = "oklch(0.14 0.04 252)";
const CARD_BORDER = "oklch(0.71 0.16 75 / 0.3)";
const GOLD = "oklch(0.71 0.16 75)";
const INPUT_BG = "oklch(0.19 0.046 252)";
const MUTED = "oklch(0.55 0.02 252)";
const FG = "oklch(0.93 0.008 252)";

export function RecordBuildModal({ heroes, onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [heroId, setHeroId] = useState<bigint | null>(null);
  const [heroSearch, setHeroSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Screenshots
  const [mainScreenshot, setMainScreenshot] = useState<string | null>(null);
  const [branchScreenshots, setBranchScreenshots] = useState<string[]>([]);
  const [itemScreenshots, setItemScreenshots] = useState<string[]>([]);

  const mainRef = useRef<HTMLInputElement>(null);
  const branchRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readFileAsBase64(file);
    setMainScreenshot(data);
  };

  const handleBranchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 8 - branchScreenshots.length;
    const toRead = files.slice(0, remaining);
    const results = await Promise.all(toRead.map(readFileAsBase64));
    setBranchScreenshots((prev) => [...prev, ...results]);
  };

  const handleItemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 3 - itemScreenshots.length;
    const toRead = files.slice(0, remaining);
    const results = await Promise.all(toRead.map(readFileAsBase64));
    setItemScreenshots((prev) => [...prev, ...results]);
  };

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
      const id = await actor.createRecordedBuild({
        id: 0n,
        title: title.trim(),
        heroId,
        authorId: identity.getPrincipal(),
        createdAt: BigInt(Date.now()),
      });
      // Save screenshots to localStorage keyed by build id
      const key = `slr_recorded_build_screenshots_${id.toString()}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          main: mainScreenshot,
          branches: branchScreenshots,
          items: itemScreenshots,
        }),
      );
      toast.success(t("Сборка записана!", "Build recorded!"));
      queryClient.invalidateQueries({ queryKey: ["myRecordedBuilds"] });
      onClose();
    } catch {
      toast.error(t("Ошибка", "Error"));
    } finally {
      setSaving(false);
    }
  };

  const filteredHeroes = heroSearch.trim()
    ? heroes.filter((h) =>
        h.name.toLowerCase().includes(heroSearch.toLowerCase()),
      )
    : heroes;

  const selectedHero =
    heroId != null ? heroes.find((h) => h.id === heroId) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-display text-xl uppercase tracking-wide"
            style={{ color: GOLD }}
          >
            {t("Запись сборки", "Record Build")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Title */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              {t("Название", "Title")}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              style={{
                background: INPUT_BG,
                border: `1px solid ${CARD_BORDER}`,
                color: FG,
              }}
              placeholder={t("Введите название...", "Enter title...")}
              data-ocid="record_build.input"
            />
          </div>

          {/* Hero selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                className="text-xs uppercase tracking-wide"
                style={{ color: MUTED }}
              >
                {t("Герой", "Hero")}
              </Label>
              {selectedHero && (
                <div className="flex items-center gap-2">
                  <img
                    src={selectedHero.imageUrl}
                    alt={selectedHero.name}
                    className="w-7 h-7 rounded-full object-cover"
                    style={{ border: `2px solid ${GOLD}` }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect width='28' height='28' rx='14' fill='%23334155'/%3E%3C/svg%3E";
                    }}
                  />
                  <span className="text-xs font-bold" style={{ color: GOLD }}>
                    {selectedHero.name}
                  </span>
                </div>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Поиск героя..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-2 outline-none"
              style={{
                background: INPUT_BG,
                border: `1px solid ${CARD_BORDER}`,
                color: FG,
              }}
            />

            {/* Icon grid */}
            <div
              className="grid gap-2 max-h-52 overflow-y-auto pr-1"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))",
              }}
            >
              {filteredHeroes.map((hero) => {
                const active = heroId === hero.id;
                return (
                  <button
                    key={hero.id.toString()}
                    type="button"
                    onClick={() => setHeroId(active ? null : hero.id)}
                    title={hero.name}
                    className="flex flex-col items-center gap-1 p-1 rounded-xl transition-all"
                    style={{
                      background: active ? `${GOLD}22` : INPUT_BG,
                      border: active
                        ? `1px solid ${GOLD}`
                        : `1px solid ${GOLD}1a`,
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

          {/* Main screenshot */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              Главный скриншот (TAB){" "}
              <span style={{ color: "oklch(0.65 0.2 25)" }}>*обязательно</span>
            </Label>
            <div className="mt-2">
              {mainScreenshot ? (
                <div className="relative inline-block">
                  <img
                    src={mainScreenshot}
                    alt="main"
                    className="h-24 rounded-lg object-cover"
                    style={{ border: `1px solid ${CARD_BORDER}` }}
                  />
                  <button
                    type="button"
                    onClick={() => setMainScreenshot(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.5 0.2 25)", color: "white" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mainRef.current?.click()}
                  className="w-full py-4 rounded-xl text-sm border-dashed text-center transition-colors"
                  style={{ border: `2px dashed ${CARD_BORDER}`, color: MUTED }}
                  data-ocid="record_build.upload_button"
                >
                  + Загрузить скриншот
                </button>
              )}
              <input
                ref={mainRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainUpload}
              />
            </div>
          </div>

          {/* Branch screenshots */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              Скриншоты веток (до 8)
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {branchScreenshots.map((src, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: screenshots have no stable id
                <div key={`branch-${i}`} className="relative">
                  <img
                    src={src}
                    alt={`branch-${i}`}
                    className="w-16 h-16 rounded-lg object-cover"
                    style={{ border: `1px solid ${CARD_BORDER}` }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setBranchScreenshots((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.5 0.2 25)", color: "white" }}
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
              {branchScreenshots.length < 8 && (
                <button
                  type="button"
                  onClick={() => branchRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-xl border-dashed transition-colors"
                  style={{ border: `2px dashed ${CARD_BORDER}`, color: MUTED }}
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={branchRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleBranchUpload}
            />
          </div>

          {/* Item screenshots */}
          <div>
            <Label
              className="text-xs uppercase tracking-wide"
              style={{ color: MUTED }}
            >
              Скриншоты предметов (до 3)
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {itemScreenshots.map((src, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: screenshots have no stable id
                <div key={`item-${i}`} className="relative">
                  <img
                    src={src}
                    alt={`item-${i}`}
                    className="w-16 h-16 rounded-lg object-cover"
                    style={{ border: `1px solid ${CARD_BORDER}` }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItemScreenshots((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.5 0.2 25)", color: "white" }}
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
              {itemScreenshots.length < 3 && (
                <button
                  type="button"
                  onClick={() => itemRef.current?.click()}
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-xl border-dashed transition-colors"
                  style={{ border: `2px dashed ${CARD_BORDER}`, color: MUTED }}
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={itemRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleItemUpload}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              style={{
                border: `1px solid ${CARD_BORDER}`,
                color: MUTED,
                background: "transparent",
              }}
              data-ocid="record_build.cancel_button"
            >
              {t("Отмена", "Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: GOLD, color: CARD_BG, fontWeight: 700 }}
              data-ocid="record_build.submit_button"
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

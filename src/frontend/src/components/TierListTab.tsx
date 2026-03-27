import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Branch, Hero, Item } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type TierKey = "S" | "A" | "B" | "C" | "D";
type PoolType = "heroes" | "items" | "branches";

interface TierItem {
  id: string;
  name: string;
  type: PoolType;
  imageUrl?: string;
}

interface TierState {
  S: TierItem[];
  A: TierItem[];
  B: TierItem[];
  C: TierItem[];
  D: TierItem[];
  pool: TierItem[];
}

const TIER_COLORS: Record<TierKey, string> = {
  S: "bg-red-600 text-white",
  A: "bg-orange-500 text-white",
  B: "bg-yellow-500 text-black",
  C: "bg-yellow-300 text-black",
  D: "bg-slate-500 text-white",
};

const TIER_HEX: Record<TierKey, string> = {
  S: "#dc2626",
  A: "#f97316",
  B: "#eab308",
  C: "#fde047",
  D: "#64748b",
};

interface Props {
  heroes: Hero[];
  items: Item[];
  branches: Branch[];
}

export function TierListTab({ heroes, items, branches }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const [poolTab, setPoolTab] = useState<PoolType>("heroes");
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TierItem | null>(null);
  const tierContainerRef = useRef<HTMLDivElement>(null);

  const makePool = useCallback(
    (): TierItem[] => [
      ...heroes.map((h) => ({
        id: `hero-${h.id}`,
        name: h.name,
        type: "heroes" as PoolType,
        imageUrl: h.imageUrl || undefined,
      })),
      ...items.map((i) => ({
        id: `item-${i.id}`,
        name: i.name,
        type: "items" as PoolType,
        imageUrl: i.imageUrl || undefined,
      })),
      ...branches.map((b) => ({
        id: `branch-${b.id}`,
        name: b.name,
        type: "branches" as PoolType,
        imageUrl: b.imageUrl || undefined,
      })),
    ],
    [heroes, items, branches],
  );

  const [tiers, setTiers] = useState<TierState>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    pool: [],
  });

  useEffect(() => {
    const pool = makePool();
    const imageMap = new Map(pool.map((p) => [p.id, p.imageUrl]));
    if (isLoggedIn && actor && identity) {
      actor
        .getTierList(identity.getPrincipal())
        .then((data) => {
          if (data) {
            try {
              const saved = JSON.parse(data) as Omit<TierState, "pool">;
              const rehydrate = (arr: TierItem[]): TierItem[] =>
                arr.map((item) => ({
                  ...item,
                  imageUrl: imageMap.get(item.id),
                }));
              const usedIds = new Set([
                ...saved.S.map((i) => i.id),
                ...saved.A.map((i) => i.id),
                ...saved.B.map((i) => i.id),
                ...saved.C.map((i) => i.id),
                ...saved.D.map((i) => i.id),
              ]);
              setTiers({
                S: rehydrate(saved.S),
                A: rehydrate(saved.A),
                B: rehydrate(saved.B),
                C: rehydrate(saved.C),
                D: rehydrate(saved.D),
                pool: pool.filter((i) => !usedIds.has(i.id)),
              });
            } catch {
              setTiers((prev) => ({ ...prev, pool }));
            }
          } else {
            setTiers((prev) => ({ ...prev, pool }));
          }
        })
        .catch(() => setTiers((prev) => ({ ...prev, pool })));
    } else {
      setTiers((prev) => ({ ...prev, pool }));
    }
  }, [makePool, isLoggedIn, actor, identity]);

  const TIER_KEYS: TierKey[] = ["S", "A", "B", "C", "D"];

  const moveToTier = (item: TierItem, tier: TierKey) => {
    setTiers((prev) => {
      const newState = { ...prev };
      for (const k of ["S", "A", "B", "C", "D", "pool"] as (
        | TierKey
        | "pool"
      )[]) {
        (newState[k] as TierItem[]) = (newState[k] as TierItem[]).filter(
          (i) => i.id !== item.id,
        );
      }
      newState[tier] = [...newState[tier], item];
      return newState;
    });
  };

  const removeFromTier = (item: TierItem) => {
    setTiers((prev) => {
      const newState = { ...prev };
      for (const k of TIER_KEYS) {
        newState[k] = newState[k].filter((i) => i.id !== item.id);
      }
      if (!newState.pool.some((i) => i.id === item.id)) {
        newState.pool = [...newState.pool, item];
      }
      return newState;
    });
  };

  const saveTierList = async () => {
    if (!actor || !isLoggedIn) {
      toast.error(t("Войдите для сохранения", "Login to save"));
      return;
    }
    setSaving(true);
    try {
      const data = {
        S: tiers.S,
        A: tiers.A,
        B: tiers.B,
        C: tiers.C,
        D: tiers.D,
      };
      await actor.saveTierList(JSON.stringify(data));
      toast.success(t("Тир-лист сохранён", "Tier list saved"));
    } catch {
      toast.error(t("Ошибка сохранения", "Save error"));
    } finally {
      setSaving(false);
    }
  };

  const resetTierList = async () => {
    const pool = makePool();
    setTiers({ S: [], A: [], B: [], C: [], D: [], pool });
    setSelectedItem(null);
    if (actor && isLoggedIn) {
      try {
        await actor.deleteMyTierList();
      } catch {}
    }
  };

  const downloadAsPng = async () => {
    const CELL = 56;
    const LABEL_W = 56;
    const GAP = 4;
    const PADDING = 8;
    const ROW_H = CELL + GAP * 2;

    const canvas = document.createElement("canvas");
    const maxCols = Math.max(...TIER_KEYS.map((k) => tiers[k].length), 1);
    canvas.width = LABEL_W + PADDING * 2 + maxCols * (CELL + GAP);
    canvas.height = TIER_KEYS.length * ROW_H + PADDING * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImage = (url: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });

    for (let ri = 0; ri < TIER_KEYS.length; ri++) {
      const tier = TIER_KEYS[ri];
      const y = PADDING + ri * ROW_H;

      // Tier label box
      ctx.fillStyle = TIER_HEX[tier];
      ctx.fillRect(PADDING, y, LABEL_W, ROW_H - GAP);
      ctx.fillStyle = tier === "B" || tier === "C" ? "#000" : "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tier, PADDING + LABEL_W / 2, y + (ROW_H - GAP) / 2);

      // Items
      for (let ci = 0; ci < tiers[tier].length; ci++) {
        const item = tiers[tier][ci];
        const x = PADDING + LABEL_W + GAP + ci * (CELL + GAP);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x, y, CELL, CELL);
        if (item.imageUrl) {
          const img = await loadImage(item.imageUrl);
          if (img) {
            ctx.drawImage(img, x, y, CELL, CELL);
          } else {
            ctx.fillStyle = "#94a3b8";
            ctx.font = "11px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.name.slice(0, 6), x + CELL / 2, y + CELL / 2);
          }
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.name.slice(0, 6), x + CELL / 2, y + CELL / 2);
        }
      }
    }

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "tier-list.png";
    a.click();
    toast.success("Тир-лист скачан!");
  };

  const filteredPool = tiers.pool.filter((i) => i.type === poolTab);

  const handlePoolItemClick = (item: TierItem) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  };

  const handleTierRowClick = (tier: TierKey) => {
    if (selectedItem) {
      moveToTier(selectedItem, tier);
      setSelectedItem(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2
          className="font-display text-2xl font-bold uppercase tracking-wide"
          style={{ color: "oklch(0.55 0.18 45)" }}
        >
          {t("ТИР-ЛИСТ", "TIER LIST")}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadAsPng}
            className="gap-1 text-xs"
            style={{
              border: "1px solid oklch(0.72 0.19 40 / 0.4)",
              color: "oklch(0.55 0.18 45)",
            }}
            data-ocid="tierlist.secondary_button"
          >
            <Download size={12} />
            {t("Скачать", "Download")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetTierList}
            className="gap-1 text-xs"
            style={{
              border: "1px solid oklch(0.72 0.19 40 / 0.3)",
              color: "oklch(0.5 0.02 240)",
            }}
            data-ocid="tierlist.delete_button"
          >
            <RotateCcw size={12} />
            {t("Сброс", "Reset")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveTierList}
            disabled={saving || !isLoggedIn}
            title={
              !isLoggedIn
                ? t("Войдите для сохранения", "Login to save")
                : t("Сохранить тир-лист", "Save tier list")
            }
            className="gap-1 text-xs"
            style={{
              background: "oklch(0.55 0.18 45)",
              color: "oklch(1 0 0)",
              fontWeight: 700,
            }}
            data-ocid="tierlist.save_button"
          >
            <Save size={12} />
            {t("Сохранить", "Save")}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-3 flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {selectedItem ? (
            <span style={{ color: "oklch(0.55 0.18 45)" }}>
              ✓ Выбран: <strong>{selectedItem.name}</strong> — нажмите на тир
              чтобы добавить
            </span>
          ) : (
            "Кликните по иконке снизу → затем нажмите на тир чтобы добавить"
          )}
        </p>
        {selectedItem && (
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Отмена
          </button>
        )}
      </div>

      {/* Hint box */}
      <div
        className="text-xs mb-3 px-3 py-2 rounded"
        style={{
          background: "oklch(0.72 0.19 40 / 0.08)",
          border: "1px solid oklch(0.72 0.19 40 / 0.3)",
          color: "oklch(0.55 0.18 45)",
        }}
      >
        💡 Нажмите иконку снизу, затем строку тира — добавить. Перетаскивание
        тоже работает.
      </div>

      {/* Tier rows */}
      <div ref={tierContainerRef} className="space-y-2 mb-8">
        {TIER_KEYS.map((tier) => (
          <TierRow
            key={tier}
            tier={tier}
            items={tiers[tier]}
            onDrop={(item) => moveToTier(item, tier)}
            onRemove={removeFromTier}
            onRowClick={() => handleTierRowClick(tier)}
            hasSelectedItem={!!selectedItem}
          />
        ))}
      </div>

      {/* Pool */}
      <div
        className="rounded p-4"
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.72 0.19 40 / 0.2)",
        }}
      >
        <div
          className="flex gap-0 mb-4 border-b"
          style={{ borderColor: "oklch(0.72 0.19 40 / 0.15)" }}
        >
          {(["heroes", "items", "branches"] as PoolType[]).map((pt) => (
            <button
              type="button"
              key={pt}
              onClick={() => setPoolTab(pt)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors"
              style={{
                borderColor:
                  poolTab === pt ? "oklch(0.55 0.18 45)" : "transparent",
                color:
                  poolTab === pt
                    ? "oklch(0.55 0.18 45)"
                    : "oklch(0.5 0.02 240)",
              }}
              data-ocid={`tierlist.${pt}.tab`}
            >
              {pt === "heroes"
                ? t("Герои", "Heroes")
                : pt === "items"
                  ? t("Предметы", "Items")
                  : t("Ветки", "Branches")}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {filteredPool.map((item) => (
            <PoolItem
              key={item.id}
              item={item}
              onDragStart={() => {}}
              selected={selectedItem?.id === item.id}
              onClick={() => handlePoolItemClick(item)}
            />
          ))}
          {filteredPool.length === 0 && (
            <p
              className="col-span-full text-xs text-muted-foreground"
              data-ocid="tierlist.pool.empty_state"
            >
              {t("Все добавлены в тир", "All placed in tiers")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TierRow({
  tier,
  items,
  onDrop,
  onRemove,
  onRowClick,
  hasSelectedItem,
}: {
  tier: TierKey;
  items: TierItem[];
  onDrop: (item: TierItem) => void;
  onRemove: (item: TierItem) => void;
  onRowClick?: () => void;
  hasSelectedItem?: boolean;
}) {
  const [draggingOver, setDraggingOver] = useState(false);

  return (
    <div
      className={`flex items-stretch min-h-16 rounded overflow-hidden transition-colors ${
        draggingOver
          ? "ring-2 ring-primary"
          : hasSelectedItem
            ? "cursor-pointer"
            : ""
      }`}
      style={{
        border: draggingOver
          ? "1px solid oklch(0.55 0.18 45)"
          : hasSelectedItem
            ? "1px solid oklch(0.72 0.19 40 / 0.5)"
            : "1px solid oklch(0.72 0.19 40 / 0.15)",
      }}
      onClick={hasSelectedItem ? onRowClick : undefined}
      onKeyDown={
        hasSelectedItem
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onRowClick?.();
            }
          : undefined
      }
      role={hasSelectedItem ? "button" : undefined}
      tabIndex={hasSelectedItem ? 0 : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setDraggingOver(true);
      }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDraggingOver(false);
        const data = e.dataTransfer.getData("item");
        if (data) onDrop(JSON.parse(data) as TierItem);
      }}
    >
      <div
        className={`w-14 flex items-center justify-center font-display font-black text-xl flex-shrink-0 ${TIER_COLORS[tier]}`}
      >
        {tier}
      </div>
      <div
        className="flex-1 flex flex-wrap gap-2 p-2 overflow-hidden"
        style={{ background: "oklch(0.98 0.005 240)" }}
      >
        {items.map((item) => (
          <ImageTile
            key={item.id}
            item={item}
            size={56}
            onClick={() => onRemove(item)}
            title={`${item.name} — нажмите для удаления`}
          />
        ))}
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground/30 italic self-center">
            перетащи или выбери
          </span>
        )}
      </div>
    </div>
  );
}

function PoolItem({
  item,
  selected,
  onClick,
}: {
  item: TierItem;
  onDragStart: () => void;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("item", JSON.stringify(item));
      }}
      onClick={onClick}
      className="cursor-pointer select-none rounded transition-all w-10 h-10 overflow-hidden"
      title={item.name}
      style={
        selected
          ? { outline: "2px solid oklch(0.55 0.18 45)", outlineOffset: "2px" }
          : {}
      }
    >
      <ImageTile item={item} size={40} />
    </button>
  );
}

function ImageTile({
  item,
  size,
  onClick,
  title,
}: {
  item: TierItem;
  size: number;
  onClick?: () => void;
  title?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const dim = size === 56 ? "w-14 h-14" : "w-10 h-10";

  const content = (
    <>
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`${dim} object-cover`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${dim} flex items-center justify-center text-xs font-bold uppercase bg-muted text-muted-foreground`}
        >
          {item.name[0]}
        </div>
      )}
      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white text-center px-0.5 leading-tight py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {item.name}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title ?? item.name}
        className={`group relative ${dim} rounded overflow-hidden border border-border hover:border-destructive transition-colors flex-shrink-0`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      title={title ?? item.name}
      className={`group relative ${dim} rounded overflow-hidden border border-border hover:border-primary/50 transition-colors`}
    >
      {content}
    </div>
  );
}

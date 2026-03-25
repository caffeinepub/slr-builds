import { Button } from "@/components/ui/button";
import { RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
              // Re-attach imageUrls from current pool data
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
    if (actor && isLoggedIn) {
      try {
        await actor.deleteMyTierList();
      } catch {}
    }
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-glow">
          {t("ТИР-ЛИСТ", "TIER LIST")}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetTierList}
            className="gap-1 text-xs"
            data-ocid="tierlist.secondary_button"
          >
            <RotateCcw size={12} />
            {t("Сброс", "Reset")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveTierList}
            disabled={saving}
            className="gap-1 text-xs bg-primary hover:bg-primary/80 glow-red"
            data-ocid="tierlist.save_button"
          >
            <Save size={12} />
            {t("Сохранить", "Save")}
          </Button>
        </div>
      </div>

      {/* Instructions + selected item indicator */}
      <div className="mb-3 flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {selectedItem ? (
            <span style={{ color: "oklch(0.71 0.16 75)" }}>
              ✓ Выбран: <strong>{selectedItem.name}</strong> — нажмите на тир
              чтобы добавить, или выберите другого
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

      {/* Tier rows */}
      <div className="space-y-2 mb-8">
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
      <div className="bg-card border border-border rounded p-4">
        <div className="flex gap-0 mb-4 border-b border-border">
          {(["heroes", "items", "branches"] as PoolType[]).map((pt) => (
            <button
              type="button"
              key={pt}
              onClick={() => setPoolTab(pt)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
                poolTab === pt
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
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
        <div className="flex flex-wrap gap-2">
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
              className="text-xs text-muted-foreground"
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
      className={`flex items-stretch min-h-16 border ${
        draggingOver
          ? "border-primary bg-primary/5"
          : hasSelectedItem
            ? "border-yellow-400/50 cursor-pointer hover:border-yellow-400"
            : "border-border"
      } rounded overflow-hidden transition-colors`}
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
      <div className="flex-1 flex flex-wrap gap-2 p-2 bg-card">
        {items.map((item) => (
          <ImageTile
            key={item.id}
            item={item}
            size={56}
            onClick={() => onRemove(item)}
            title={`${item.name} — click to remove`}
          />
        ))}
        {items.length === 0 && (
          <span className="text-xs text-muted-foreground/30 italic self-center">
            drag here
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
      className="cursor-pointer select-none rounded transition-all"
      title={item.name}
      style={
        selected
          ? {
              outline: "2px solid oklch(0.71 0.16 75)",
              outlineOffset: "2px",
              borderRadius: "6px",
            }
          : {}
      }
    >
      <ImageTile item={item} size={48} />
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
  const sizeClass = size === 56 ? "w-14 h-14" : "w-12 h-12";

  const content = (
    <>
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`${sizeClass} object-cover`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${sizeClass} flex items-center justify-center text-xs font-bold uppercase bg-muted text-muted-foreground`}
        >
          {item.name[0]}
        </div>
      )}
      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white text-center px-0.5 leading-tight py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
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
        className={`group relative ${sizeClass} rounded overflow-hidden border border-border hover:border-destructive transition-colors`}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      title={title ?? item.name}
      className={`group relative ${sizeClass} rounded overflow-hidden border border-border hover:border-primary/50 transition-colors`}
    >
      {content}
    </div>
  );
}

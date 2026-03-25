import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Branch, Hero, Item, Skill } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type AdminTab = "heroes" | "skills" | "items" | "branches";

export function AdminPage() {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("heroes");

  const seedMutation = useMutation({
    mutationFn: () => actor!.seedTestData(),
    onSuccess: () => {
      toast.success(t("Тестовые данные загружены", "Test data seeded"));
      queryClient.invalidateQueries();
    },
    onError: () => toast.error(t("Ошибка", "Error")),
  });

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        {t(
          "Войдите чтобы получить доступ",
          "Please log in to access this page",
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-glow">
          {t("АДМИН ПАНЕЛЬ", "ADMIN PANEL")}
        </h1>
        <Button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          variant="outline"
          className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
        >
          {seedMutation.isPending ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Database size={14} />
          )}
          {t("Загрузить тест данные", "Seed Test Data")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6">
        {(["heroes", "skills", "items", "branches"] as AdminTab[]).map((at) => (
          <button
            type="button"
            key={at}
            onClick={() => setTab(at)}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
              tab === at
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {at === "heroes"
              ? t("Герои", "Heroes")
              : at === "skills"
                ? t("Навыки", "Skills")
                : at === "items"
                  ? t("Предметы", "Items")
                  : t("Ветки", "Branches")}
          </button>
        ))}
      </div>

      {tab === "heroes" && <HeroesPanel />}
      {tab === "skills" && <SkillsPanel />}
      {tab === "items" && <ItemsPanel />}
      {tab === "branches" && <BranchesPanel />}
    </div>
  );
}

function HeroesPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [tier, setTier] = useState("A");
  const [imageUrl, setImageUrl] = useState("");

  const { data: heroes = [], isLoading } = useQuery({
    queryKey: ["heroes"],
    queryFn: () => actor!.getAllHeroes(),
    enabled: !!actor,
  });

  const addMutation = useMutation({
    mutationFn: () => actor!.addHero({ id: 0n, name, tier, imageUrl }),
    onSuccess: () => {
      toast.success(t("Герой добавлен", "Hero added"));
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
      setName("");
      setImageUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteHero(id),
    onSuccess: () => {
      toast.success(t("Удалено", "Deleted"));
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-card border border-border rounded">
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Имя", "Name")}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Тир", "Tier")}
          </Label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="mt-1 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {["S", "A", "B", "C", "D"].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("URL изображения", "Image URL")}
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <Button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !name.trim()}
          className="bg-primary hover:bg-primary/80 gap-1 col-span-full md:col-span-1"
        >
          <Plus size={14} /> {t("Добавить", "Add")}
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : (
        <div className="space-y-2">
          {heroes.map((h) => (
            <div
              key={h.id.toString()}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
            >
              <div>
                <span className="font-bold">{h.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  Tier: {h.tier}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(h.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkillsPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState("basic");
  const [imageUrl, setImageUrl] = useState("");

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: () => actor!.getAllSkills(),
    enabled: !!actor,
  });

  const addMutation = useMutation({
    mutationFn: () => actor!.addSkill({ id: 0n, name, rarity, imageUrl }),
    onSuccess: () => {
      toast.success(t("Навык добавлен", "Skill added"));
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setName("");
      setImageUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteSkill(id),
    onSuccess: () => {
      toast.success(t("Удалено", "Deleted"));
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-card border border-border rounded">
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Имя", "Name")}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Редкость", "Rarity")}
          </Label>
          <Select value={rarity} onValueChange={setRarity}>
            <SelectTrigger className="mt-1 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="legendary">
                {t("Легендарный", "Legendary")}
              </SelectItem>
              <SelectItem value="rare">{t("Редкий", "Rare")}</SelectItem>
              <SelectItem value="basic">{t("Базовый", "Basic")}</SelectItem>
              <SelectItem value="adjacent">
                {t("Смежный", "Adjacent")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("URL изображения", "Image URL")}
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <Button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !name.trim()}
          className="bg-primary hover:bg-primary/80 gap-1 col-span-full md:col-span-1"
        >
          <Plus size={14} /> {t("Добавить", "Add")}
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : (
        <div className="space-y-2">
          {skills.map((s) => (
            <div
              key={s.id.toString()}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
            >
              <div>
                <span className="font-bold">{s.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {s.rarity}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(s.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemsPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => actor!.getAllItems(),
    enabled: !!actor,
  });

  const addMutation = useMutation({
    mutationFn: () => actor!.addItem({ id: 0n, name, imageUrl }),
    onSuccess: () => {
      toast.success(t("Предмет добавлен", "Item added"));
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setName("");
      setImageUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteItem(id),
    onSuccess: () => {
      toast.success(t("Удалено", "Deleted"));
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 bg-card border border-border rounded">
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Имя", "Name")}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("URL изображения", "Image URL")}
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <Button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !name.trim()}
          className="bg-primary hover:bg-primary/80 gap-1"
        >
          <Plus size={14} /> {t("Добавить", "Add")}
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id.toString()}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
            >
              <span className="font-bold">{item.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BranchesPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => actor!.getAllBranches(),
    enabled: !!actor,
  });

  const addMutation = useMutation({
    mutationFn: () => actor!.addBranch({ id: 0n, name, imageUrl }),
    onSuccess: () => {
      toast.success(t("Ветка добавлена", "Branch added"));
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setName("");
      setImageUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteBranch(id),
    onSuccess: () => {
      toast.success(t("Удалено", "Deleted"));
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 bg-card border border-border rounded">
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Имя", "Name")}
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("URL изображения", "Image URL")}
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 bg-secondary border-border"
          />
        </div>
        <Button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !name.trim()}
          className="bg-primary hover:bg-primary/80 gap-1"
        >
          <Plus size={14} /> {t("Добавить", "Add")}
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : (
        <div className="space-y-2">
          {branches.map((b) => (
            <div
              key={b.id.toString()}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
            >
              <span className="font-bold">{b.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(b.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

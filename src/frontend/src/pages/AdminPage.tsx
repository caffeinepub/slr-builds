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
import {
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Branch, Hero, Item, Skill } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";

const ADMIN_AUTH_KEY = "slr_admin_auth";
const ADMIN_PASSWORD = "garenA11";

type AdminTab = "heroes" | "skills" | "items" | "branches" | "builds" | "users";

export function AdminPage() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("heroes");

  // Password gate
  const [isAuthed, setIsAuthed] = useState(
    () => localStorage.getItem(ADMIN_AUTH_KEY) === "1",
  );
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const handlePwSubmit = () => {
    if (pwInput === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_AUTH_KEY, "1");
      setIsAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthed(false);
  };

  const [seedStep, setSeedStep] = useState(0);

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!actor) {
        throw new Error("Актор не загружен");
      }
      setSeedStep(1);
      await actor.seedSkillsAndBranches();
      setSeedStep(2);
      await actor.seedHeroes();
      setSeedStep(3);
      await actor.seedItems();
      setSeedStep(4);
      await actor.seedBuilds();
      setSeedStep(0);
    },
    onSuccess: () => {
      toast.success(
        t(
          "Тестовые данные загружены (42 сборки, 65 героев, 99 предметов)",
          "Test data seeded (42 builds, 65 heroes, 99 items)",
        ),
      );
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      setSeedStep(0);
      toast.error(
        `${t("Ошибка загрузки данных", "Error seeding data")}: ${String(err).slice(0, 100)}`,
      );
    },
  });

  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div
          className="w-full max-w-sm p-8 bg-black border border-primary/60"
          style={{ boxShadow: "0 0 30px rgba(220,38,38,0.3)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-primary" size={20} />
            <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary">
              {t("ВХОД В АДМИНКУ", "ADMIN ACCESS")}
            </h2>
          </div>
          <Label className="text-xs uppercase text-muted-foreground">
            {t("Пароль", "Password")}
          </Label>
          <Input
            type="password"
            value={pwInput}
            onChange={(e) => {
              setPwInput(e.target.value);
              setPwError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handlePwSubmit()}
            className="mt-2 mb-1 bg-secondary border-primary/40 focus:border-primary"
            placeholder="••••••••"
            data-ocid="admin.input"
          />
          {pwError && (
            <p
              className="text-xs text-destructive mb-3"
              data-ocid="admin.error_state"
            >
              {t("Неверный пароль", "Wrong password")}
            </p>
          )}
          <Button
            onClick={handlePwSubmit}
            className="w-full mt-3 bg-primary hover:bg-primary/80 font-bold uppercase tracking-widest glow-red"
            data-ocid="admin.submit_button"
          >
            {t("Войти в панель", "Enter Panel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-glow">
          {t("АДМИН ПАНЕЛЬ", "ADMIN PANEL")}
        </h1>
        <div className="flex gap-2">
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
            {seedMutation.isPending
              ? seedStep === 1
                ? t("Загрузка навыков...", "Loading skills...")
                : seedStep === 2
                  ? t("Загрузка героев...", "Loading heroes...")
                  : seedStep === 3
                    ? t("Загрузка предметов...", "Loading items...")
                    : seedStep === 4
                      ? t("Загрузка сборок...", "Loading builds...")
                      : t("Загрузка...", "Loading...")
              : t("Загрузить тест данные", "Seed Test Data")}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            data-ocid="admin.close_button"
          >
            <X size={14} />
            {t("Выйти из панели", "Exit Panel")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border mb-6 overflow-x-auto">
        {(
          [
            "heroes",
            "skills",
            "items",
            "branches",
            "builds",
            "users",
          ] as AdminTab[]
        ).map((at) => (
          <button
            type="button"
            key={at}
            onClick={() => setTab(at)}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              tab === at
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="admin.tab"
          >
            {at === "heroes"
              ? t("Герои", "Heroes")
              : at === "skills"
                ? t("Навыки", "Skills")
                : at === "items"
                  ? t("Предметы", "Items")
                  : at === "branches"
                    ? t("Ветки", "Branches")
                    : at === "builds"
                      ? t("Сборки", "Builds")
                      : t("Пользователи", "Users")}
          </button>
        ))}
      </div>

      {tab === "heroes" && <HeroesPanel />}
      {tab === "skills" && <SkillsPanel />}
      {tab === "items" && <ItemsPanel />}
      {tab === "branches" && <BranchesPanel />}
      {tab === "builds" && <BuildsPanel />}
      {tab === "users" && <UsersPanel />}
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
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editTier, setEditTier] = useState("A");
  const [editImageUrl, setEditImageUrl] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: (hero: Hero) => actor!.updateHero(hero),
    onSuccess: () => {
      toast.success(t("Сохранено", "Saved"));
      queryClient.invalidateQueries({ queryKey: ["heroes"] });
      setEditingId(null);
    },
  });

  const startEdit = (h: Hero) => {
    setEditingId(h.id);
    setEditName(h.name);
    setEditTier(h.tier);
    setEditImageUrl(h.imageUrl);
  };

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
              {["S", "A", "B", "C", "D"].map((tv) => (
                <SelectItem key={tv} value={tv}>
                  {tv}
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
              className="bg-secondary border border-border rounded"
            >
              {editingId === h.id ? (
                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder={t("Имя", "Name")}
                  />
                  <Select value={editTier} onValueChange={setEditTier}>
                    <SelectTrigger className="bg-card border-primary/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["S", "A", "B", "C", "D"].map((tv) => (
                        <SelectItem key={tv} value={tv}>
                          {tv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder="Image URL"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80 flex-1"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: h.id,
                          name: editName,
                          tier: editTier,
                          imageUrl: editImageUrl,
                        })
                      }
                    >
                      {t("Сохранить", "Save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      {t("Отмена", "Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="font-bold">{h.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Tier: {h.tier}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary/70 hover:text-primary"
                      onClick={() => startEdit(h)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(h.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
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
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editRarity, setEditRarity] = useState("basic");
  const [editImageUrl, setEditImageUrl] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: (skill: Skill) => actor!.updateSkill(skill),
    onSuccess: () => {
      toast.success(t("Сохранено", "Saved"));
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setEditingId(null);
    },
  });

  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRarity(s.rarity);
    setEditImageUrl(s.imageUrl);
  };

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
              className="bg-secondary border border-border rounded"
            >
              {editingId === s.id ? (
                <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder={t("Имя", "Name")}
                  />
                  <Select value={editRarity} onValueChange={setEditRarity}>
                    <SelectTrigger className="bg-card border-primary/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="legendary">
                        {t("Легендарный", "Legendary")}
                      </SelectItem>
                      <SelectItem value="rare">
                        {t("Редкий", "Rare")}
                      </SelectItem>
                      <SelectItem value="basic">
                        {t("Базовый", "Basic")}
                      </SelectItem>
                      <SelectItem value="adjacent">
                        {t("Смежный", "Adjacent")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder="Image URL"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80 flex-1"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: s.id,
                          name: editName,
                          rarity: editRarity,
                          imageUrl: editImageUrl,
                        })
                      }
                    >
                      {t("Сохранить", "Save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      {t("Отмена", "Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="font-bold">{s.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.rarity}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary/70 hover:text-primary"
                      onClick={() => startEdit(s)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(s.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
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
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: (item: Item) => actor!.updateItem(item),
    onSuccess: () => {
      toast.success(t("Сохранено", "Saved"));
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setEditingId(null);
    },
  });

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditImageUrl(item.imageUrl);
  };

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
              className="bg-secondary border border-border rounded"
            >
              {editingId === item.id ? (
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder={t("Имя", "Name")}
                  />
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder="Image URL"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80 flex-1"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: item.id,
                          name: editName,
                          imageUrl: editImageUrl,
                        })
                      }
                    >
                      {t("Сохранить", "Save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      {t("Отмена", "Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <span className="font-bold">{item.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary/70 hover:text-primary"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
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
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

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

  const updateMutation = useMutation({
    mutationFn: (branch: Branch) => actor!.updateBranch(branch),
    onSuccess: () => {
      toast.success(t("Сохранено", "Saved"));
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setEditingId(null);
    },
  });

  const startEdit = (b: Branch) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditImageUrl(b.imageUrl);
  };

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
              className="bg-secondary border border-border rounded"
            >
              {editingId === b.id ? (
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder={t("Имя", "Name")}
                  />
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="bg-card border-primary/40"
                    placeholder="Image URL"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80 flex-1"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: b.id,
                          name: editName,
                          imageUrl: editImageUrl,
                        })
                      }
                    >
                      {t("Сохранить", "Save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      {t("Отмена", "Cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3">
                  <span className="font-bold">{b.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary/70 hover:text-primary"
                      onClick={() => startEdit(b)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(b.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuildsPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: builds = [], isLoading } = useQuery({
    queryKey: ["publicBuilds"],
    queryFn: () => actor!.getPublicBuilds(),
    enabled: !!actor,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: bigint) => actor!.toggleBuildVisibility(id),
    onSuccess: () => {
      toast.success(t("Видимость изменена", "Visibility toggled"));
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteBuildById(id),
    onSuccess: () => {
      toast.success(t("Удалено", "Deleted"));
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
      queryClient.invalidateQueries({ queryKey: ["builds"] });
    },
  });

  return (
    <div>
      {isLoading ? (
        <Loader2 className="animate-spin text-primary" size={20} />
      ) : builds.length === 0 ? (
        <p
          className="text-muted-foreground text-sm"
          data-ocid="builds.empty_state"
        >
          {t("Нет публичных сборок", "No public builds")}
        </p>
      ) : (
        <div className="space-y-2">
          {builds.map((build, idx) => (
            <div
              key={build.id.toString()}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
              data-ocid={`admin.builds.item.${idx + 1}`}
            >
              <div>
                <span className="font-bold">{build.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {build.heroIds.length} {t("героев", "heroes")}
                </span>
                <span
                  className={`ml-2 text-xs ${
                    build.isPublic ? "text-green-400" : "text-muted-foreground"
                  }`}
                >
                  {build.isPublic
                    ? t("Публичный", "Public")
                    : t("Скрытый", "Hidden")}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary/70 hover:text-primary"
                  title={t("Переключить видимость", "Toggle visibility")}
                  onClick={() => toggleMutation.mutate(build.id)}
                >
                  {build.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate(build.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const actorAny = actor as any;

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registeredUsers"],
    queryFn: () => actorAny.getAllRegisteredUsers(),
    enabled: !!actor && typeof actorAny.getAllRegisteredUsers === "function",
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  if (error)
    return (
      <p className="text-destructive text-sm">
        {t("Ошибка загрузки", "Load error")}
      </p>
    );

  return (
    <div className="space-y-4" data-ocid="admin.users">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-widest neon-text">
          {t("Зарегистрированные пользователи", "Registered Users")} (
          {users.length})
        </h3>
      </div>
      {users.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t("Нет зарегистрированных пользователей", "No registered users yet")}
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((user: any, idx: number) => (
            <div
              key={user.principal?.toString() ?? idx}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
              data-ocid="admin.users.item"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm">
                  {user.name && user.name !== "—"
                    ? user.name
                    : t("Без имени", "No name")}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {user.principal?.toString() ?? "—"}
                </span>
                {user.uid && (
                  <span className="text-[10px] text-primary font-mono">
                    UID: {user.uid}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {user.registeredAt
                  ? new Date(
                      Number(user.registeredAt) / 1_000_000,
                    ).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

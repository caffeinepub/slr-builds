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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Database,
  Eye,
  EyeOff,
  GitBranch,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Mic,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Swords,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { Branch, Hero, Item, Skill } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";

const ADMIN_AUTH_KEY = "slr_admin_auth";
const ADMIN_PASSWORD = "garenA11";

type AdminTab =
  | "heroes"
  | "skills"
  | "items"
  | "branches"
  | "builds"
  | "users"
  | "chat"
  | "comments"
  | "stats"
  | "restart"
  | "admins";

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
      await new Promise((r) => setTimeout(r, 800));
      setSeedStep(2);
      await actor.seedHeroes();
      await new Promise((r) => setTimeout(r, 800));
      setSeedStep(3);
      await actor.seedItemsA();
      await new Promise((r) => setTimeout(r, 800));
      setSeedStep(4);
      await actor.seedItemsB();
      await new Promise((r) => setTimeout(r, 800));
      setSeedStep(5);
      await actor.seedBuildsA();
      await new Promise((r) => setTimeout(r, 800));
      setSeedStep(6);
      await actor.seedBuildsB();
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
      setTimeout(() => {
        queryClient.refetchQueries({ type: "active" });
      }, 500);
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

  const SIDEBAR_TABS: {
    key: AdminTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "heroes", label: "Герои", icon: <Users size={16} /> },
    { key: "skills", label: "Навыки", icon: <Zap size={16} /> },
    { key: "items", label: "Предметы", icon: <Package size={16} /> },
    { key: "branches", label: "Ветки", icon: <GitBranch size={16} /> },
    { key: "builds", label: "Сборки", icon: <Swords size={16} /> },
    { key: "users", label: "Пользователи", icon: <Users size={16} /> },
    { key: "chat", label: "Чат", icon: <MessageSquare size={16} /> },
    {
      key: "comments",
      label: "Комментарии",
      icon: <MessageCircle size={16} />,
    },
    { key: "stats", label: "Статистика", icon: <BarChart3 size={16} /> },
    { key: "restart", label: "Перезапуск", icon: <RefreshCw size={16} /> },
    { key: "admins", label: "Администраторы", icon: <Shield size={16} /> },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="text-primary" size={22} />
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-primary">
            Админ Панель
          </h1>
          <span className="flex items-center gap-1.5 px-2 py-1 bg-green-950/60 border border-green-700/40 rounded text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Все данные доступны гостям
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => actor && seedMutation.mutate()}
            disabled={seedMutation.isPending}
            variant="outline"
            className="gap-2 border-primary/50 text-primary hover:bg-primary/10 text-sm"
            data-ocid="admin.primary_button"
          >
            {seedMutation.isPending || !actor ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <Database size={13} />
            )}
            {!actor
              ? "Подключение..."
              : seedMutation.isPending
                ? seedStep === 1
                  ? "Шаг 1/6: Навыки..."
                  : seedStep === 2
                    ? "Шаг 2/6: Герои..."
                    : seedStep === 3
                      ? "Шаг 3/6: Предметы (1/2)..."
                      : seedStep === 4
                        ? "Шаг 4/6: Предметы (2/2)..."
                        : seedStep === 5
                          ? "Шаг 5/6: Сборки (1/2)..."
                          : seedStep === 6
                            ? "Шаг 6/6: Сборки (2/2)..."
                            : "Загрузка..."
                : "Загрузить тест данные"}
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            data-ocid="admin.close_button"
          >
            <X size={13} />
            Выйти
          </Button>
        </div>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-0 min-h-[70vh]">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border border-border rounded-l bg-card/50 flex flex-col py-2">
          {SIDEBAR_TABS.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => setTab(item.key)}
              data-ocid="admin.tab"
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all border-l-2 text-left w-full ${
                tab === item.key
                  ? "border-l-primary text-primary bg-primary/8"
                  : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 border border-l-0 border-border rounded-r bg-card/20 p-5 overflow-auto">
          {tab === "heroes" && <HeroesPanel />}
          {tab === "skills" && <SkillsPanel />}
          {tab === "items" && <ItemsPanel />}
          {tab === "branches" && <BranchesPanel />}
          {tab === "builds" && <BuildsPanel />}
          {tab === "users" && <UsersPanel />}
          {tab === "chat" && <ChatModerationPanel />}
          {tab === "comments" && <CommentsModerationPanel />}
          {tab === "stats" && <StatsPanel />}
          {tab === "restart" && <RestartPanel />}
          {tab === "admins" && <AdminsPanel />}
        </div>
      </div>
    </div>
  );
}

function RestartPanel() {
  const handleReload = () => {
    if (
      window.confirm(
        "Перезагрузить сайт? Все несохранённые данные будут потеряны.",
      )
    ) {
      window.location.reload();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Очистить весь чат? Это действие необратимо.")) {
      toast.info(
        "Функция очистки чата доступна через вкладку Чат → Очистить весь чат",
      );
    }
  };

  return (
    <div className="space-y-6" data-ocid="admin.restart.panel">
      <div className="flex items-center gap-2">
        <RefreshCw size={16} className="text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">
          Управление сайтом
        </h3>
      </div>

      <div className="p-4 border border-border rounded bg-card/50 space-y-2">
        <p className="text-xs text-muted-foreground">
          Инструменты для управления работой сайта. Используйте с осторожностью
          — некоторые действия необратимы.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-primary/20 rounded bg-card/30">
          <h4 className="font-bold text-sm mb-1 text-foreground">
            Перезагрузка сайта
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Принудительно перезагружает страницу сайта. Полезно после обновления
            данных.
          </p>
          <Button
            onClick={handleReload}
            className="gap-2 bg-primary hover:bg-primary/80"
            data-ocid="admin.restart.primary_button"
          >
            <RefreshCw size={14} />
            Перезагрузить сайт
          </Button>
        </div>

        <div className="p-4 border border-destructive/30 rounded bg-destructive/5">
          <h4 className="font-bold text-sm mb-1 text-destructive">
            Очистить чат
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Удаляет все сообщения из общего чата. Это действие необратимо.
          </p>
          <Button
            variant="destructive"
            onClick={handleClearChat}
            className="gap-2"
            data-ocid="admin.restart.delete_button"
          >
            <Trash2 size={14} />
            Очистить чат
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminsPanel() {
  const { actor } = useActor();
  const actorAny = actor as any;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["registeredUsers"],
    queryFn: () => actorAny.getAllRegisteredUsers(),
    enabled: !!actor && typeof actorAny.getAllRegisteredUsers === "function",
  });

  const handleAssignAdmin = async (user: any) => {
    if (
      !window.confirm(
        `Назначить ${user.name || user.principal} администратором?`,
      )
    )
      return;
    try {
      if (typeof actorAny.assignUserRole === "function") {
        await actorAny.assignUserRole(user.principal, { admin: null });
        toast.success("Роль администратора назначена");
      } else {
        toast.info("Функция назначения ролей ещё не подключена к бэкенду");
      }
    } catch (e) {
      toast.error(`Ошибка: ${String(e).slice(0, 80)}`);
    }
  };

  const handleRevokeAdmin = async (user: any) => {
    if (
      !window.confirm(
        `Снять права администратора с ${user.name || user.principal}?`,
      )
    )
      return;
    try {
      if (typeof actorAny.assignUserRole === "function") {
        await actorAny.assignUserRole(user.principal, { user: null });
        toast.success("Права администратора сняты");
      } else {
        toast.info("Функция управления ролями ещё не подключена к бэкенду");
      }
    } catch (e) {
      toast.error(`Ошибка: ${String(e).slice(0, 80)}`);
    }
  };

  return (
    <div className="space-y-4" data-ocid="admin.admins.panel">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-widest text-primary">
          Управление администраторами ({users.length})
        </h3>
      </div>

      <div className="p-3 border border-primary/20 rounded bg-primary/5 text-xs text-muted-foreground">
        Здесь можно назначить или снять права администратора у
        зарегистрированных пользователей. Для доступа к панели администратор
        должен знать пароль.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <p
          className="text-muted-foreground text-sm text-center py-8"
          data-ocid="admin.admins.empty_state"
        >
          Нет зарегистрированных пользователей
        </p>
      ) : (
        <div className="space-y-2">
          {(users as any[]).map((user: any, idx: number) => (
            <div
              key={user.principal?.toString() ?? idx}
              className="flex items-center justify-between p-3 bg-secondary border border-border rounded"
              data-ocid={`admin.admins.item.${idx + 1}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm">
                  {user.name && user.name !== "—" ? user.name : "Без имени"}
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/80 text-xs h-7"
                  onClick={() => handleAssignAdmin(user)}
                  data-ocid="admin.admins.primary_button"
                >
                  <Shield size={12} className="mr-1" />
                  Назначить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 text-xs h-7"
                  onClick={() => handleRevokeAdmin(user)}
                  data-ocid="admin.admins.delete_button"
                >
                  <X size={12} className="mr-1" />
                  Снять
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
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
                  <div className="flex items-center gap-2">
                    {h.imageUrl && (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        className="w-8 h-8 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="font-bold">{h.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
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

interface ItemMeta {
  description: string;
  tip: string;
}

function getItemMeta(id: bigint): ItemMeta {
  try {
    const raw = localStorage.getItem(`slr_item_meta_${id}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { description: "", tip: "" };
}

function saveItemMeta(id: bigint, meta: ItemMeta) {
  localStorage.setItem(`slr_item_meta_${id}`, JSON.stringify(meta));
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
  const [editDescription, setEditDescription] = useState("");
  const [editTip, setEditTip] = useState("");

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
    const meta = getItemMeta(item.id);
    setEditDescription(meta.description);
    setEditTip(meta.tip);
  };

  const handleSave = (item: Item) => {
    saveItemMeta(item.id, { description: editDescription, tip: editTip });
    updateMutation.mutate({
      id: item.id,
      name: editName,
      imageUrl: editImageUrl,
    });
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
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">
                        {t("Имя", "Name")}
                      </Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 bg-card border-primary/40"
                        placeholder={t("Имя", "Name")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">
                        Image URL
                      </Label>
                      <Input
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        className="mt-1 bg-card border-primary/40"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      {t("Описание", "Description")}
                    </Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="mt-1 bg-card border-primary/40 resize-none"
                      rows={2}
                      placeholder={t(
                        "Описание предмета...",
                        "Item description...",
                      )}
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      {t("Совет по использованию", "Usage tip")}
                    </Label>
                    <Textarea
                      value={editTip}
                      onChange={(e) => setEditTip(e.target.value)}
                      className="mt-1 bg-card border-primary/40 resize-none"
                      rows={2}
                      placeholder={t("Совет...", "Tip...")}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80 flex-1"
                      disabled={updateMutation.isPending}
                      onClick={() => handleSave(item)}
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
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <span className="font-bold">{item.name}</span>
                      {(() => {
                        const meta = getItemMeta(item.id);
                        return meta.description ? (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {meta.description}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
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

function ChatModerationPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const actorAny = actor as any;
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminChatMessages"],
    queryFn: async () => {
      if (typeof actorAny.getChatMessages !== "function") return [];
      return actorAny.getChatMessages();
    },
    enabled: !!actor,
    refetchInterval: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actorAny.deleteChatMessage(id),
    onSuccess: () => {
      toast.success(t("Сообщение удалено", "Message deleted"));
      queryClient.invalidateQueries({ queryKey: ["adminChatMessages"] });
    },
    onError: () => toast.error(t("Ошибка удаления", "Delete error")),
  });

  const clearMutation = useMutation({
    mutationFn: () => actorAny.clearAllChat(),
    onSuccess: () => {
      toast.success(t("Чат очищен", "Chat cleared"));
      queryClient.invalidateQueries({ queryKey: ["adminChatMessages"] });
    },
    onError: () => toast.error(t("Ошибка очистки", "Clear error")),
  });

  const handleClear = () => {
    if (
      window.confirm(
        t(
          "Очистить весь чат? Это действие необратимо.",
          "Clear all chat? This cannot be undone.",
        ),
      )
    ) {
      clearMutation.mutate();
    }
  };

  const formatTime = (ts: bigint) => {
    try {
      return new Date(Number(ts) / 1_000_000).toLocaleString("ru-RU");
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4" data-ocid="admin.chat.panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-primary">
            {t("Модерация чата", "Chat Moderation")} ({messages.length})
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 border-border text-muted-foreground hover:text-foreground"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            {t("Обновить", "Refresh")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={handleClear}
            disabled={clearMutation.isPending || messages.length === 0}
            data-ocid="admin.chat.delete_button"
          >
            <Trash2 size={13} />
            {t("Очистить весь чат", "Clear all chat")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.chat.empty_state"
        >
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t("Чат пуст", "Chat is empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(messages as any[]).map((msg: any, idx: number) => (
            <div
              key={msg.id?.toString() ?? idx}
              className="flex items-start justify-between p-3 bg-secondary border border-border rounded gap-3"
              data-ocid={`admin.chat.item.${idx + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-primary truncate">
                    {msg.authorName || t("Аноним", "Anonymous")}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 truncate">
                  {String(msg.text ?? "").startsWith("VOICE:") ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mic size={12} />{" "}
                      {t("Голосовое сообщение", "Voice message")}
                    </span>
                  ) : (
                    msg.text
                  )}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive flex-shrink-0"
                onClick={() => deleteMutation.mutate(BigInt(msg.id))}
                disabled={deleteMutation.isPending}
                data-ocid="admin.chat.delete_button"
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

function CommentsModerationPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const actorAny = actor as any;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const {
    data: comments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminAllComments"],
    queryFn: async () => {
      if (typeof actorAny.getAllBuildComments !== "function") return [];
      return actorAny.getAllBuildComments();
    },
    enabled: !!actor,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actorAny.adminDeleteBuildComment(id),
    onSuccess: () => {
      toast.success(t("Комментарий удалён", "Comment deleted"));
      queryClient.invalidateQueries({ queryKey: ["adminAllComments"] });
    },
    onError: () => toast.error(t("Ошибка удаления", "Delete error")),
  });

  const filtered = (comments as any[]).filter((c: any) => {
    if (!search.trim()) return true;
    return String(c.authorName ?? "")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const formatTime = (ts: bigint) => {
    try {
      return new Date(Number(ts) / 1_000_000).toLocaleString("ru-RU");
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4" data-ocid="admin.comments.panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-primary">
            {t("Модерация комментариев", "Comments Moderation")} (
            {comments.length})
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 border-border text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          {t("Обновить", "Refresh")}
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("Поиск по автору...", "Search by author...")}
        className="bg-secondary border-border"
        data-ocid="admin.comments.search_input"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin.comments.empty_state"
        >
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {search
              ? t("Ничего не найдено", "Nothing found")
              : t("Комментариев нет", "No comments")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((comment: any, idx: number) => (
            <div
              key={comment.id?.toString() ?? idx}
              className="flex items-start justify-between p-3 bg-secondary border border-border rounded gap-3"
              data-ocid={`admin.comments.item.${idx + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm text-primary">
                    {comment.authorName || t("Аноним", "Anonymous")}
                  </span>
                  <span className="text-xs text-muted-foreground bg-card px-1.5 py-0.5 rounded">
                    {t("Сборка", "Build")} #{comment.buildId?.toString() ?? "?"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 truncate">
                  {String(comment.text ?? "").startsWith("VOICE:") ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Mic size={12} />{" "}
                      {t("Голосовой комментарий", "Voice comment")}
                    </span>
                  ) : (
                    comment.text
                  )}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive flex-shrink-0"
                onClick={() => deleteMutation.mutate(BigInt(comment.id))}
                disabled={deleteMutation.isPending}
                data-ocid="admin.comments.delete_button"
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

function StatsPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const actorAny = actor as any;

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["siteStats"],
    queryFn: async (): Promise<
      [bigint, bigint, bigint, bigint, bigint, bigint]
    > => {
      if (typeof actorAny.getSiteStats !== "function") {
        return [0n, 0n, 0n, 0n, 0n, 0n];
      }
      return actorAny.getSiteStats();
    },
    enabled: !!actor,
    refetchInterval: 30000,
  });

  const statCards = [
    { icon: "🦸", label: t("Героев", "Heroes"), value: stats?.[0] ?? 0n },
    { icon: "🎒", label: t("Предметов", "Items"), value: stats?.[1] ?? 0n },
    {
      icon: "⚔️",
      label: t("Публичных сборок", "Public builds"),
      value: stats?.[2] ?? 0n,
    },
    { icon: "👤", label: t("Пользователей", "Users"), value: stats?.[3] ?? 0n },
    {
      icon: "💬",
      label: t("Комментариев", "Comments"),
      value: stats?.[4] ?? 0n,
    },
    {
      icon: "📨",
      label: t("Сообщений в чате", "Chat messages"),
      value: stats?.[5] ?? 0n,
    },
  ];

  return (
    <div className="space-y-6" data-ocid="admin.stats.panel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-widest text-primary">
            {t("Статистика сайта", "Site Statistics")}
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 border-border text-muted-foreground hover:text-foreground"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          {t("Обновить", "Refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-card border border-border rounded-lg p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
            >
              <span className="text-3xl">{card.icon}</span>
              <span className="text-3xl font-bold text-primary font-mono">
                {String(card.value)}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-center">
                {card.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "../../contexts/LangContext";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

interface Props {
  onClose: () => void;
}

const AVATAR_COLORS = [
  { label: "Золото", value: "color:#B8960C" },
  { label: "Красный", value: "color:#C0392B" },
  { label: "Синий", value: "color:#1A6EBD" },
  { label: "Зелёный", value: "color:#1A7A44" },
  { label: "Фиолетовый", value: "color:#7B2D8B" },
  { label: "Бирюза", value: "color:#1A7A7A" },
];

function getAvatarKey(principal: string) {
  return `slr_avatar_${principal}`;
}

function getClanKey(principal: string) {
  return `slr_clan_${principal}`;
}

function AvatarDisplay({
  avatarVal,
  initials,
  size = 56,
}: {
  avatarVal: string;
  initials: string;
  size?: number;
}) {
  if (avatarVal.startsWith("hero:")) {
    const num = avatarVal.slice(5);
    return (
      <img
        src={`https://say-gg.ru/images/heroes/${num}.png`}
        alt="avatar"
        className="rounded-full object-cover border-2 border-primary"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  if (avatarVal.startsWith("color:")) {
    const color = avatarVal.slice(6);
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold border-2 border-primary text-white"
        style={{
          width: size,
          height: size,
          background: color,
          fontSize: size * 0.35,
        }}
      >
        {initials || "?"}
      </div>
    );
  }
  // initials default
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold border-2 border-primary"
      style={{
        width: size,
        height: size,
        background: "oklch(0.71 0.16 75)",
        color: "oklch(0.14 0.04 252)",
        fontSize: size * 0.35,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function ProfileModal({ onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principal = identity?.getPrincipal().toString() ?? "";

  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState("");
  const [addFriendUid, setAddFriendUid] = useState("");
  const [searchUid, setSearchUid] = useState("");
  const [searchResult, setSearchResult] = useState<
    [string, string] | null | undefined
  >(undefined);

  // Avatar state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarVal, setAvatarVal] = useState<string>(() =>
    principal
      ? (localStorage.getItem(getAvatarKey(principal)) ?? "initials")
      : "initials",
  );

  // Clan state
  const [editingClan, setEditingClan] = useState(false);
  const [clanValue, setClanValue] = useState<string>(() =>
    principal ? (localStorage.getItem(getClanKey(principal)) ?? "") : "",
  );
  const [clanInput, setClanInput] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const { data: uid } = useQuery({
    queryKey: ["myUID"],
    queryFn: () => actor!.getMyUID(),
    enabled: !!actor && !!identity,
  });

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["myFriends"],
    queryFn: () => actor!.getMyFriends(),
    enabled: !!actor && !!identity,
  });

  const { data: builds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ["myBuilds"],
    queryFn: () => actor!.getMyBuilds(),
    enabled: !!actor && !!identity,
  });

  const saveNickMutation = useMutation({
    mutationFn: (name: string) => actor!.saveCallerUserProfile({ name }),
    onSuccess: () => {
      toast.success(t("Ник сохранён", "Nickname saved"));
      setEditingNick(false);
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myUID"] });
    },
    onError: () => {
      toast.error(t("Ошибка сохранения", "Save error"));
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: (friendUid: string) => actor!.addFriend(friendUid),
    onSuccess: () => {
      toast.success(t("Друг добавлен", "Friend added"));
      setAddFriendUid("");
      queryClient.invalidateQueries({ queryKey: ["myFriends"] });
    },
    onError: () => toast.error(t("Ошибка. Проверьте UID", "Error. Check UID")),
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendUid: string) => actor!.removeFriend(friendUid),
    onSuccess: () => {
      toast.success(t("Друг удалён", "Friend removed"));
      queryClient.invalidateQueries({ queryKey: ["myFriends"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteBuildById(id),
    onSuccess: () => {
      toast.success(t("Сборка удалена", "Build deleted"));
      queryClient.invalidateQueries({ queryKey: ["myBuilds"] });
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: bigint) => actor!.toggleBuildVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBuilds"] });
      queryClient.invalidateQueries({ queryKey: ["publicBuilds"] });
    },
  });

  const handleSearchByUid = async () => {
    if (!searchUid.trim() || !actor) return;
    const res = await actor.getUserByUID(searchUid.trim());
    setSearchResult(res);
  };

  const currentName = profile?.name ?? "";
  const initials = currentName
    ? currentName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const handleStartEdit = () => {
    setNickValue(currentName);
    setEditingNick(true);
  };

  const copyUID = () => {
    if (uid) {
      navigator.clipboard.writeText(uid);
      toast.success(t("UID скопирован", "UID copied"));
    }
  };

  const handleSelectAvatar = (val: string) => {
    setAvatarVal(val);
    if (principal) localStorage.setItem(getAvatarKey(principal), val);
    setShowAvatarPicker(false);
  };

  const handleSaveClan = () => {
    setClanValue(clanInput);
    if (principal) localStorage.setItem(getClanKey(principal), clanInput);
    setEditingClan(false);
    toast.success(t("Клан сохранён", "Clan saved"));
  };

  const handleStartClanEdit = () => {
    setClanInput(clanValue);
    setEditingClan(true);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto rounded-none"
        data-ocid="profile.modal"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wide text-glow">
            {t("Профиль", "Profile")}
          </DialogTitle>
        </DialogHeader>

        {!identity && (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t(
                "Войдите в аккаунт для просмотра профиля",
                "Log in to view your profile",
              )}
            </p>
          </div>
        )}

        {identity && (
          <>
            {/* Avatar section */}
            <div className="flex items-center gap-4 mt-4 mb-5">
              <div className="relative">
                <AvatarDisplay
                  avatarVal={avatarVal}
                  initials={initials}
                  size={60}
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker((v) => !v)}
                  className="text-xs text-primary hover:underline transition-colors"
                  data-ocid="profile.edit_button"
                >
                  {showAvatarPicker
                    ? t("Закрыть", "Close")
                    : t("Изменить аватар", "Change avatar")}
                </button>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentName || t("(не задан)", "(not set)")}
                </p>
              </div>
            </div>

            {/* Avatar picker */}
            {showAvatarPicker && (
              <div
                className="mb-4 p-3 border border-primary/30 rounded-none"
                style={{ background: "oklch(0.12 0.03 252)" }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {t("Иконка героя", "Hero icon")}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => handleSelectAvatar(`hero:${num}`)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                        avatarVal === `hero:${num}`
                          ? "border-primary"
                          : "border-border"
                      }`}
                    >
                      <img
                        src={`https://say-gg.ru/images/heroes/${num}.png`}
                        alt={`hero ${num}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "0.3";
                        }}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {t("Цвет", "Color")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => handleSelectAvatar(c.value)}
                      title={c.label}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        avatarVal === c.value
                          ? "border-primary"
                          : "border-border"
                      }`}
                      style={{ background: c.value.slice(6) }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectAvatar("initials")}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center text-xs font-bold ${
                      avatarVal === "initials"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{
                      background: "oklch(0.71 0.16 75)",
                      color: "oklch(0.14 0.04 252)",
                    }}
                    title="Инициалы"
                  >
                    {initials}
                  </button>
                </div>
              </div>
            )}

            {/* Nickname section */}
            <div className="mt-2 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t("Никнейм", "Nickname")}
              </p>
              {profileLoading ? (
                <Loader2 className="animate-spin text-primary" size={18} />
              ) : editingNick ? (
                <div className="flex gap-2">
                  <Input
                    value={nickValue}
                    onChange={(e) => setNickValue(e.target.value)}
                    className="bg-black border-primary/40 rounded-none h-8 text-sm"
                    placeholder={t("Введите ник", "Enter nickname")}
                    maxLength={32}
                    data-ocid="profile.input"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/80 rounded-none h-8 glow-red"
                    disabled={!nickValue.trim() || saveNickMutation.isPending}
                    onClick={() => saveNickMutation.mutate(nickValue.trim())}
                    data-ocid="profile.save_button"
                  >
                    {saveNickMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      t("Сохранить", "Save")
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none h-8"
                    onClick={() => setEditingNick(false)}
                    data-ocid="profile.cancel_button"
                  >
                    {t("Отмена", "Cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold text-sm">
                    {currentName || t("(не задан)", "(not set)")}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-ocid="profile.edit_button"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Clan section */}
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t("Клан", "Clan")}
              </p>
              {editingClan ? (
                <div className="flex gap-2">
                  <Input
                    value={clanInput}
                    onChange={(e) => setClanInput(e.target.value)}
                    className="bg-black border-primary/40 rounded-none h-8 text-sm"
                    placeholder={t("Название клана", "Clan name")}
                    maxLength={32}
                    data-ocid="profile.input"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/80 rounded-none h-8"
                    onClick={handleSaveClan}
                    data-ocid="profile.save_button"
                  >
                    {t("Сохранить", "Save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-none h-8"
                    onClick={() => setEditingClan(false)}
                    data-ocid="profile.cancel_button"
                  >
                    {t("Отмена", "Cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm">
                    {clanValue || t("(не указан)", "(not set)")}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartClanEdit}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-ocid="profile.edit_button"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* UID section */}
            <div className="mb-4 p-3 bg-secondary border border-border rounded-none">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t("Ваш UID", "Your UID")}
              </p>
              {uid ? (
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-primary bg-black px-2 py-1 border border-primary/30 flex-1">
                    {uid}
                  </code>
                  <button
                    type="button"
                    onClick={copyUID}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title={t("Скопировать", "Copy")}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Сохраните профиль для получения UID",
                    "Save profile to get UID",
                  )}
                </p>
              )}
            </div>

            {/* Friends section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("Друзья", "Friends")}
                </p>
                {friends.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {friends.length}
                  </span>
                )}
              </div>

              {/* Add friend by UID */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={addFriendUid}
                  onChange={(e) => setAddFriendUid(e.target.value)}
                  placeholder={t("UID друга", "Friend's UID")}
                  className="bg-black border-primary/40 rounded-none h-8 text-xs flex-1"
                  data-ocid="profile.input"
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/80 rounded-none h-8 glow-red"
                  disabled={!addFriendUid.trim() || addFriendMutation.isPending}
                  onClick={() => addFriendMutation.mutate(addFriendUid.trim())}
                  data-ocid="profile.primary_button"
                >
                  <UserPlus size={14} />
                </Button>
              </div>

              {/* Search by UID */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={searchUid}
                  onChange={(e) => setSearchUid(e.target.value)}
                  placeholder={t("Поиск по UID", "Search by UID")}
                  className="bg-black border-border rounded-none h-8 text-xs flex-1"
                  data-ocid="profile.search_input"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none h-8 border-border"
                  onClick={handleSearchByUid}
                  data-ocid="profile.secondary_button"
                >
                  <Search size={14} />
                </Button>
              </div>

              {searchResult !== undefined && (
                <div className="mb-3 p-2 bg-black border border-border rounded-none">
                  {searchResult === null ? (
                    <p className="text-xs text-muted-foreground">
                      {t("Не найдено", "Not found")}
                    </p>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold">
                          {searchResult[1]}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                          {searchResult[0]}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-6 text-[10px] bg-primary hover:bg-primary/80 rounded-none"
                        onClick={() =>
                          addFriendMutation.mutate(searchResult[0])
                        }
                      >
                        <UserPlus size={10} className="mr-1" />
                        {t("Добавить", "Add")}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Friends list */}
              {friendsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-primary" size={18} />
                </div>
              ) : friends.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground py-2"
                  data-ocid="profile.empty_state"
                >
                  {t("Друзей нет", "No friends yet")}
                </p>
              ) : (
                <div className="space-y-1">
                  {friends.map((f, i) => (
                    <div
                      key={f.uid}
                      className="flex items-center justify-between p-2 bg-secondary border border-border rounded-none"
                      data-ocid={`profile.item.${i + 1}`}
                    >
                      <div>
                        <span className="text-xs font-bold">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                          {f.uid}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFriendMutation.mutate(f.uid)}
                        data-ocid={`profile.delete_button.${i + 1}`}
                      >
                        <UserMinus size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Builds section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("Мои сборки", "My Builds")}
                </p>
                {builds.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {builds.length}
                  </span>
                )}
              </div>
              {buildsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : builds.length === 0 ? (
                <p
                  className="text-center text-muted-foreground py-6 text-sm"
                  data-ocid="profile.empty_state"
                >
                  {t("Нет сборок", "No builds yet")}
                </p>
              ) : (
                <div className="space-y-2">
                  {builds.map((build, i) => (
                    <div
                      key={build.id.toString()}
                      className="flex items-center justify-between p-3 bg-secondary border border-border rounded-none"
                      data-ocid={`profile.item.${i + 1}`}
                    >
                      <div>
                        <p className="font-bold text-sm">{build.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {build.isPublic
                            ? t("Публичная", "Public")
                            : t("Скрытая", "Hidden")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => toggleMutation.mutate(build.id)}
                          title={
                            build.isPublic
                              ? t("Скрыть", "Hide")
                              : t("Показать", "Show")
                          }
                        >
                          {build.isPublic ? (
                            <Eye size={14} />
                          ) : (
                            <EyeOff size={14} />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(build.id)}
                          data-ocid={`profile.delete_button.${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

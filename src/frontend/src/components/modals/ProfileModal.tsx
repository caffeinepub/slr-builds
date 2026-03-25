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

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { t } = useLang();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState("");
  const [addFriendUid, setAddFriendUid] = useState("");
  const [searchUid, setSearchUid] = useState("");
  const [searchResult, setSearchResult] = useState<
    [string, string] | null | undefined
  >(undefined);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor,
  });

  const { data: uid } = useQuery({
    queryKey: ["myUID"],
    queryFn: () => actor!.getMyUID(),
    enabled: !!actor,
  });

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["myFriends"],
    queryFn: () => actor!.getMyFriends(),
    enabled: !!actor,
  });

  const { data: builds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ["myBuilds"],
    queryFn: () => actor!.getMyBuilds(),
    enabled: !!actor,
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

        {/* Nickname section */}
        <div className="mt-4 mb-4">
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
                    <span className="text-xs font-bold">{searchResult[1]}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                      {searchResult[0]}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="h-6 text-[10px] bg-primary hover:bg-primary/80 rounded-none"
                    onClick={() => addFriendMutation.mutate(searchResult[0])}
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
      </DialogContent>
    </Dialog>
  );
}

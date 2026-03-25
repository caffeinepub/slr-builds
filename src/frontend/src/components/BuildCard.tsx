import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Shield,
  Sword,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Build, BuildComment, Hero, Skill } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  build: Build;
  heroes: Hero[];
  skills: Skill[];
  "data-ocid"?: string;
}

function parseSkillName(name: string, lang: string): string {
  if (name.includes(" / ")) {
    const parts = name.split(" / ");
    return lang === "ru" ? parts[0] : parts[1];
  }
  return name;
}

export function BuildCard({
  build,
  heroes,
  skills,
  "data-ocid": dataOcid,
}: Props) {
  const { t, lang } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceRecordSecs, setVoiceRecordSecs] = useState(0);
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceAudioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildHeroes = heroes.filter((h) => build.heroIds.includes(h.id));
  const requiredSkills = skills.filter((s) =>
    build.requiredSkillIds.includes(s.id),
  );
  const forbiddenSkills = skills.filter((s) =>
    build.forbiddenSkillIds.includes(s.id),
  );

  const { data: profile } = useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const shortPrincipal = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : t("Гость", "Guest");
  const displayName = profile?.name || shortPrincipal;

  const { data: votes, refetch: refetchVotes } = useQuery({
    queryKey: ["buildVotes", build.id.toString()],
    queryFn: () => actor!.getBuildVotes(build.id),
    enabled: !!actor && expanded,
  });

  const { data: myVote, refetch: refetchMyVote } = useQuery<boolean | null>({
    queryKey: ["myVote", build.id.toString()],
    queryFn: () => actor!.getMyVoteOnBuild(build.id),
    enabled: !!actor && !!identity && expanded,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<
    BuildComment[]
  >({
    queryKey: ["comments", build.id.toString()],
    queryFn: () => actor!.getBuildComments(build.id),
    enabled: !!actor && expanded,
  });

  const likeMutation = useMutation({
    mutationFn: () => actor!.toggleBuildLike(build.id),
    onSuccess: () => {
      refetchVotes();
      refetchMyVote();
    },
    onError: () => toast.error(t("Войдите чтобы голосовать", "Login to vote")),
  });

  const dislikeMutation = useMutation({
    mutationFn: () => actor!.toggleBuildDislike(build.id),
    onSuccess: () => {
      refetchVotes();
      refetchMyVote();
    },
    onError: () => toast.error(t("Войдите чтобы голосовать", "Login to vote")),
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) =>
      actor!.addBuildComment(build.id, displayName, text),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({
        queryKey: ["comments", build.id.toString()],
      });
    },
    onError: () => toast.error(t("Ошибка", "Error")),
  });

  const addVoiceCommentMutation = useMutation({
    mutationFn: (audioData: string) =>
      actor!.addVoiceBuildComment(build.id, displayName, audioData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", build.id.toString()],
      });
      toast.success(t("Голосовой комментарий добавлен", "Voice comment added"));
    },
    onError: () => toast.error(t("Ошибка отправки", "Send error")),
  });

  const startVoiceComment = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      voiceAudioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) voiceAudioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        for (const trk of stream.getTracks()) trk.stop();
        const blob = new Blob(voiceAudioChunksRef.current, {
          type: mr.mimeType,
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(",")[1];
          addVoiceCommentMutation.mutate(b64);
        };
        reader.readAsDataURL(blob);
        setVoiceRecording(false);
        setVoiceRecordSecs(0);
        if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      };
      mr.start(1000);
      voiceMediaRecorderRef.current = mr;
      setVoiceRecording(true);
      setVoiceRecordSecs(0);
      // Notify user how to finish recording and turn off microphone
      toast.info(
        t(
          "Чтобы отправить — нажмите кнопку ещё раз и выключите микрофон",
          "To send — press the button again to stop and turn off microphone",
        ),
        { duration: 4000 },
      );
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordSecs((s) => {
          if (s + 1 >= 60) {
            stopVoiceComment();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error(t("Нет доступа к микрофону", "Microphone access denied"));
    }
  };

  const stopVoiceComment = () => {
    if (
      voiceMediaRecorderRef.current &&
      voiceMediaRecorderRef.current.state !== "inactive"
    ) {
      voiceMediaRecorderRef.current.stop();
    }
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
  };

  const formatVoiceTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: bigint) => actor!.deleteBuildComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments", build.id.toString()],
      });
    },
  });

  const myPrincipal = identity?.getPrincipal().toString();

  return (
    <>
      <button
        type="button"
        data-ocid={dataOcid}
        className="group relative bg-card border border-border hover:border-primary/50 rounded transition-all duration-200 overflow-hidden hover:glow-red cursor-pointer text-left w-full"
        onClick={() => setExpanded(true)}
      >
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-primary to-accent" />

        <div className="p-4">
          {/* Name */}
          <h3 className="font-display font-bold text-base uppercase tracking-wide text-foreground mb-3 line-clamp-1">
            {build.name}
          </h3>

          {/* Heroes */}
          {buildHeroes.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {t("Герои", "Heroes")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {buildHeroes.map((h) => (
                  <span
                    key={h.id.toString()}
                    className="flex items-center gap-1 text-xs bg-secondary border border-border px-2 py-0.5 rounded text-foreground"
                  >
                    {h.imageUrl && (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required skills */}
          {requiredSkills.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-green-400 uppercase tracking-wide mb-1">
                <Sword size={10} />
                {t("Нужны", "Required")}
              </div>
              <div className="flex flex-wrap gap-1">
                {requiredSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-xs border-green-400/30 text-green-400 px-1.5 py-0"
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={12}
                        height={12}
                        className="w-3 h-3 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Forbidden skills */}
          {forbiddenSkills.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-destructive uppercase tracking-wide mb-1">
                <Shield size={10} />
                {t("Запрет", "Forbidden")}
              </div>
              <div className="flex flex-wrap gap-1">
                {forbiddenSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-xs border-destructive/30 text-destructive px-1.5 py-0"
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={12}
                        height={12}
                        className="w-3 h-3 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cost */}
          {(build.costLegendary > 0n ||
            build.costRare > 0n ||
            build.costBasic > 0n) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              <Coins size={10} className="text-accent" />
              {build.costLegendary > 0n && (
                <span className="text-yellow-400">
                  {build.costLegendary.toString()}L
                </span>
              )}
              {build.costRare > 0n && (
                <span className="text-blue-400 ml-1">
                  {build.costRare.toString()}R
                </span>
              )}
              {build.costBasic > 0n && (
                <span className="ml-1">{build.costBasic.toString()}B</span>
              )}
              {build.rounds > 0n && (
                <span className="ml-1 text-accent">
                  {t("Раундов", "Rounds")}: {build.rounds.toString()}
                </span>
              )}
            </div>
          )}

          {/* Hint */}
          {build.hint && (
            <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
              {build.hint}
            </p>
          )}
        </div>
      </button>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        >
          <div
            className="relative w-full max-w-lg bg-black border border-primary/60 rounded overflow-y-auto max-h-[90vh]"
            style={{ boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}
          >
            {/* Accent top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary text-glow pr-4">
                  {build.name}
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(false)}
                  data-ocid="builds.close_button"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Hint */}
              {build.hint && (
                <p className="text-sm text-muted-foreground italic mb-5 border-l-2 border-primary/40 pl-3">
                  {build.hint}
                </p>
              )}

              {/* Heroes */}
              {buildHeroes.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                    {t("Герои", "Heroes")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buildHeroes.map((h) => (
                      <div
                        key={h.id.toString()}
                        className="flex items-center gap-2 bg-secondary border border-border px-2 py-1 rounded"
                      >
                        {h.imageUrl && (
                          <img
                            src={h.imageUrl}
                            alt={h.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Required skills */}
              {requiredSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1">
                    <Sword size={12} />{" "}
                    {t("Обязательные навыки", "Required Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-green-400/30 text-green-400 text-xs"
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Forbidden skills */}
              {forbiddenSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1">
                    <Shield size={12} />{" "}
                    {t("Запрещённые навыки", "Forbidden Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {forbiddenSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-destructive/30 text-destructive text-xs"
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost */}
              {(build.costLegendary > 0n ||
                build.costRare > 0n ||
                build.costBasic > 0n) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <Coins size={12} className="inline mr-1 text-accent" />
                    {t("Стоимость", "Cost")}
                  </p>
                  <div className="flex gap-3 text-sm">
                    {build.costLegendary > 0n && (
                      <span className="text-yellow-400">
                        {build.costLegendary.toString()} {t("Легенд.", "Leg.")}
                      </span>
                    )}
                    {build.costRare > 0n && (
                      <span className="text-blue-400">
                        {build.costRare.toString()} {t("Ред.", "Rare")}
                      </span>
                    )}
                    {build.costBasic > 0n && (
                      <span>
                        {build.costBasic.toString()} {t("Баз.", "Basic")}
                      </span>
                    )}
                    {build.rounds > 0n && (
                      <span className="text-accent">
                        {build.rounds.toString()} {t("раундов", "rounds")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Votes section */}
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => likeMutation.mutate()}
                    disabled={!identity || likeMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-none text-sm font-bold transition-all ${
                      myVote === true
                        ? "border-primary text-primary glow-red bg-primary/10"
                        : "border-border text-muted-foreground hover:border-green-400/60 hover:text-green-400"
                    }`}
                    data-ocid="builds.toggle"
                  >
                    <ThumbsUp size={14} />
                    <span>{Number(votes?.likes ?? 0)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dislikeMutation.mutate()}
                    disabled={!identity || dislikeMutation.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-none text-sm font-bold transition-all ${
                      myVote === false
                        ? "border-primary text-primary glow-red bg-primary/10"
                        : "border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                    }`}
                    data-ocid="builds.secondary_button"
                  >
                    <ThumbsDown size={14} />
                    <span>{Number(votes?.dislikes ?? 0)}</span>
                  </button>
                  {!identity && (
                    <span className="text-xs text-muted-foreground">
                      {t("Войдите чтобы голосовать", "Login to vote")}
                    </span>
                  )}
                </div>
              </div>

              {/* Comments section */}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-1">
                  <MessageSquare size={12} />
                  {t("Комментарии", "Comments")} ({comments.length})
                </p>

                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-primary" size={18} />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    {t("Нет комментариев", "No comments yet")}
                  </p>
                ) : (
                  <ScrollArea className="max-h-40 mb-3">
                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div
                          key={c.id.toString()}
                          className="bg-secondary border border-border p-2 rounded-none"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-primary">
                              {c.authorName}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(
                                  Number(c.createdAt) / 1_000_000,
                                ).toLocaleDateString()}
                              </span>
                              {myPrincipal &&
                                c.authorId.toString() === myPrincipal && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteCommentMutation.mutate(c.id)
                                    }
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                            </div>
                          </div>
                          {c.text.startsWith("VOICE:") ? (
                            <audio
                              controls
                              style={{ height: "28px", width: "100%" }}
                              src={`data:audio/webm;base64,${c.text.slice(6)}`}
                            >
                              <track kind="captions" />
                            </audio>
                          ) : (
                            <p className="text-xs text-foreground/90">
                              {c.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {identity ? (
                  <div className="space-y-1">
                    {voiceRecording && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 border border-primary/30 rounded-none">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs text-primary font-mono">
                          {formatVoiceTime(voiceRecordSecs)} / 1:00
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {t(
                            "Нажмите ещё раз чтобы отправить",
                            "Press again to send",
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={
                          voiceRecording ? stopVoiceComment : startVoiceComment
                        }
                        disabled={addVoiceCommentMutation.isPending}
                        title={
                          voiceRecording
                            ? t(
                                "Остановить и отправить (выключить микрофон)",
                                "Stop and send (turn off microphone)",
                              )
                            : t("Голосовой комментарий", "Voice comment")
                        }
                        className={`h-8 w-8 flex items-center justify-center shrink-0 transition-colors border border-primary/40 ${voiceRecording ? "text-primary animate-pulse bg-primary/10" : "text-muted-foreground hover:text-primary bg-black"}`}
                      >
                        {addVoiceCommentMutation.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : voiceRecording ? (
                          <MicOff size={13} />
                        ) : (
                          <Mic size={13} />
                        )}
                      </button>
                      <Input
                        value={commentText}
                        onChange={(e) =>
                          setCommentText(e.target.value.slice(0, 300))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && commentText.trim()) {
                            addCommentMutation.mutate(commentText.trim());
                          }
                        }}
                        placeholder={
                          voiceRecording
                            ? t("Запись голоса...", "Recording voice...")
                            : t("Ваш комментарий...", "Your comment...")
                        }
                        disabled={voiceRecording}
                        className="text-xs h-8 bg-black border-primary/40 focus:border-primary rounded-none flex-1"
                        data-ocid="builds.input"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          addCommentMutation.mutate(commentText.trim())
                        }
                        disabled={
                          !commentText.trim() ||
                          addCommentMutation.isPending ||
                          voiceRecording
                        }
                        className="h-8 bg-primary hover:bg-primary/80 rounded-none glow-red text-xs"
                        data-ocid="builds.submit_button"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          t("Отправить", "Send")
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("Войдите чтобы комментировать", "Login to comment")}
                  </p>
                )}
              </div>

              {/* Close at bottom */}
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => setExpanded(false)}
                >
                  {t("Закрыть", "Close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

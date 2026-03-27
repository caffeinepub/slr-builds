import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  Copy,
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
  defaultExpanded?: boolean;
  onClose?: () => void;
  onHeroClick?: (heroId: bigint) => void;
}

const SKILL_ID_NAMES: Record<string, string> = {
  "9": "ХП",
  "10": "УЛЬТ",
  "12": "ДОДЖ",
};

function parseSkillName(name: string, lang: string, id?: bigint): string {
  if (id !== undefined && SKILL_ID_NAMES[id.toString()]) {
    return SKILL_ID_NAMES[id.toString()];
  }
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
  defaultExpanded,
  onClose,
  onHeroClick,
}: Props) {
  const { t, lang } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
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
      toast.info(
        t(
          "Чтобы отправить — нажмите кнопку ещё раз и выключите микрофон",
          "To send \u2014 press the button again to stop and turn off microphone",
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

  const handleHeroChipClick = (heroId: bigint) => {
    setExpanded(false);
    onClose?.();
    onHeroClick?.(heroId);
  };

  const LEGENDARY_SKILLS = ["УЛЬТ", "ЯРОСТЬ", "КРИТ", "ULT", "RAGE", "CRIT"];
  const RARE_SKILLS = [
    "ЗАМОРОЗКА",
    "ЩИТ",
    "АТАКА",
    "ДОДЖ",
    "ИСЦЕЛЕНИЕ",
    "FREEZE",
    "SHIELD",
    "ATTACK",
    "DODGE",
    "HEAL",
  ];
  const topSkillName = requiredSkills[0]
    ? parseSkillName(requiredSkills[0].name, "ru", requiredSkills[0].id)
    : "";
  const isLegendary = LEGENDARY_SKILLS.includes(topSkillName);
  const isRare = RARE_SKILLS.includes(topSkillName);
  const borderColor = isLegendary
    ? "oklch(0.72 0.19 40 / 0.7)"
    : isRare
      ? "oklch(0.6 0.2 290 / 0.5)"
      : "oklch(0.72 0.19 40 / 0.15)";

  return (
    <>
      <button
        type="button"
        data-ocid={dataOcid}
        className="group relative cursor-pointer text-left w-full transition-all duration-200"
        style={{
          background: "oklch(0.10 0.015 240)",
          borderLeft: `3px solid ${borderColor}`,
          border: "1px solid oklch(0.72 0.19 40 / 0.12)",
          borderLeftWidth: "3px",
          borderLeftColor: borderColor,
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.borderLeftColor = "oklch(0.72 0.19 40)";
          el.style.borderLeftWidth = "3px";
          el.style.boxShadow = "0 2px 12px oklch(0.72 0.19 40 / 0.15)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.borderLeftColor = borderColor;
          el.style.boxShadow = "";
        }}
        onClick={() => setExpanded(true)}
      >
        <div className="p-3">
          {/* Name + Share */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wide line-clamp-1 flex-1 text-primary">
              {build.name}
            </h3>
            <button
              type="button"
              data-ocid="build.secondary_button"
              title="Поделиться"
              className="flex-shrink-0 p-0.5 opacity-40 hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.72 0.19 40)" }}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(build.name).then(() => {
                  toast.success("Скопировано!");
                });
              }}
            >
              <Copy size={11} />
            </button>
          </div>

          {/* Heroes */}
          {buildHeroes.length > 0 && (
            <div className="mb-2">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">
                {t("Герои", "Heroes")}
              </div>
              <div className="flex flex-wrap gap-1 overflow-hidden">
                {buildHeroes.map((h) => (
                  <span
                    key={h.id.toString()}
                    className="flex items-center gap-1 text-xs px-1.5 py-0.5 text-foreground"
                    style={{
                      background: "oklch(0.13 0.02 240)",
                      border: "1px solid oklch(0.72 0.19 40 / 0.15)",
                      borderRadius: "var(--radius)",
                    }}
                  >
                    {h.imageUrl && (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
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
            <div className="mb-1.5">
              <div className="flex items-center gap-1 text-[9px] text-green-400/80 uppercase tracking-widest mb-1">
                <Sword size={8} />
                {t("Нужны", "Required")}
              </div>
              <div className="flex flex-wrap gap-1">
                {requiredSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-[10px] border-green-400/25 text-green-400 px-1.5 py-0"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={10}
                        height={10}
                        className="w-2.5 h-2.5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang, s.id)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Forbidden skills */}
          {forbiddenSkills.length > 0 && (
            <div className="mb-1.5">
              <div className="flex items-center gap-1 text-[9px] text-destructive/80 uppercase tracking-widest mb-1">
                <Shield size={8} />
                {t("Запрет", "Forbidden")}
              </div>
              <div className="flex flex-wrap gap-1">
                {forbiddenSkills.map((s) => (
                  <Badge
                    key={s.id.toString()}
                    variant="outline"
                    className="flex items-center gap-1 text-[10px] border-destructive/25 text-destructive px-1.5 py-0"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt=""
                        width={10}
                        height={10}
                        className="w-2.5 h-2.5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {parseSkillName(s.name, lang, s.id)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cost */}
          {(build.costLegendary > 0n ||
            build.costRare > 0n ||
            build.costBasic > 0n) && (
            <div
              className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 pt-2"
              style={{ borderTop: "1px solid oklch(0.72 0.19 40 / 0.1)" }}
            >
              <Coins size={9} className="text-primary" />
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
                <span className="ml-1 text-primary">
                  {t("Раундов", "Rounds")}: {build.rounds.toString()}
                </span>
              )}
            </div>
          )}

          {build.hint && (
            <p className="mt-1.5 text-[10px] text-muted-foreground italic line-clamp-1">
              {build.hint}
            </p>
          )}
        </div>
      </button>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0.04 0.01 240 / 0.92)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setExpanded(false);
              onClose?.();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setExpanded(false);
              onClose?.();
            }
          }}
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg overflow-y-auto max-h-[90vh] modal-glitch hud-panel hud-scan"
            style={{
              background: "oklch(0.09 0.012 240)",
              border: "1px solid oklch(0.72 0.19 40 / 0.5)",
              borderRadius: "var(--radius)",
              boxShadow:
                "0 0 40px oklch(0.72 0.19 40 / 0.2), 0 0 80px oklch(0.72 0.19 40 / 0.08)",
            }}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="font-display text-lg font-bold uppercase tracking-widest pr-4 text-glow-orange"
                  style={{ color: "oklch(0.72 0.19 40)" }}
                >
                  {build.name}
                </h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  style={{ borderRadius: "var(--radius)" }}
                  onClick={() => {
                    setExpanded(false);
                    onClose?.();
                  }}
                  data-ocid="builds.close_button"
                >
                  <X size={14} />
                </Button>
              </div>

              {build.hint && (
                <p
                  className="text-sm text-muted-foreground italic mb-4 pl-3"
                  style={{ borderLeft: "2px solid oklch(0.72 0.19 40 / 0.4)" }}
                >
                  {build.hint}
                </p>
              )}

              {/* Heroes */}
              {buildHeroes.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-primary">
                    {t("Герои", "Heroes")}
                    {onHeroClick && (
                      <span className="ml-2 text-[9px] font-normal text-muted-foreground normal-case">
                        (нажмите чтобы найти сборки)
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buildHeroes.map((h) => (
                      <button
                        key={h.id.toString()}
                        type="button"
                        title={`Сборки с ${h.name}`}
                        onClick={() => handleHeroChipClick(h.id)}
                        className="flex items-center gap-1.5 px-2 py-1 transition-all hover:scale-105"
                        style={{
                          background: "oklch(0.13 0.02 240)",
                          border: "1px solid oklch(0.72 0.19 40 / 0.2)",
                          borderRadius: "var(--radius)",
                          cursor: onHeroClick ? "pointer" : "default",
                        }}
                        onMouseEnter={(e) => {
                          if (onHeroClick)
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.borderColor = "oklch(0.72 0.19 40)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "oklch(0.72 0.19 40 / 0.2)";
                        }}
                      >
                        {h.imageUrl && (
                          <img
                            src={h.imageUrl}
                            alt={h.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <span className="text-xs font-medium">{h.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Required skills */}
              {requiredSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1">
                    <Sword size={10} />{" "}
                    {t("Обязательные навыки", "Required Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-green-400/30 text-green-400 text-xs"
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={12}
                            height={12}
                            className="w-3 h-3 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang, s.id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Forbidden skills */}
              {forbiddenSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1">
                    <Shield size={10} />{" "}
                    {t("Запрещённые навыки", "Forbidden Skills")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {forbiddenSkills.map((s) => (
                      <Badge
                        key={s.id.toString()}
                        variant="outline"
                        className="flex items-center gap-1 border-destructive/30 text-destructive text-xs"
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        {s.imageUrl && (
                          <img
                            src={s.imageUrl}
                            alt=""
                            width={12}
                            height={12}
                            className="w-3 h-3 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        {parseSkillName(s.name, lang, s.id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost */}
              {(build.costLegendary > 0n ||
                build.costRare > 0n ||
                build.costBasic > 0n) && (
                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid oklch(0.72 0.19 40 / 0.12)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <Coins size={10} className="inline mr-1 text-primary" />
                    {t("Стоимость", "Cost")}
                  </p>
                  <div className="flex gap-3 text-xs">
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
                      <span className="text-primary">
                        {build.rounds.toString()} {t("раундов", "rounds")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Votes */}
              <div
                className="mt-4 pt-3"
                style={{ borderTop: "1px solid oklch(0.72 0.19 40 / 0.12)" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => likeMutation.mutate()}
                    disabled={!identity || likeMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      borderRadius: "var(--radius)",
                      ...(myVote === true
                        ? {
                            border: "1px solid oklch(0.72 0.19 40)",
                            color: "oklch(0.72 0.19 40)",
                            background: "oklch(0.72 0.19 40 / 0.1)",
                            boxShadow: "0 0 8px oklch(0.72 0.19 40 / 0.3)",
                          }
                        : {
                            border: "1px solid oklch(0.72 0.19 40 / 0.2)",
                            color: "oklch(0.50 0.02 60)",
                            background: "transparent",
                          }),
                    }}
                    data-ocid="builds.toggle"
                  >
                    <ThumbsUp size={12} />
                    <span>{Number(votes?.likes ?? 0)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dislikeMutation.mutate()}
                    disabled={!identity || dislikeMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all"
                    style={{
                      borderRadius: "var(--radius)",
                      ...(myVote === false
                        ? {
                            border: "1px solid oklch(0.55 0.22 20)",
                            color: "oklch(0.55 0.22 20)",
                            background: "oklch(0.55 0.22 20 / 0.1)",
                          }
                        : {
                            border: "1px solid oklch(0.72 0.19 40 / 0.2)",
                            color: "oklch(0.50 0.02 60)",
                            background: "transparent",
                          }),
                    }}
                    data-ocid="builds.secondary_button"
                  >
                    <ThumbsDown size={12} />
                    <span>{Number(votes?.dislikes ?? 0)}</span>
                  </button>
                  {!identity && (
                    <span className="text-[10px] text-muted-foreground">
                      {t("Войдите чтобы голосовать", "Login to vote")}
                    </span>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div
                className="mt-4 pt-3"
                style={{ borderTop: "1px solid oklch(0.72 0.19 40 / 0.12)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1 text-primary">
                  <MessageSquare size={10} />
                  {t("Комментарии", "Comments")} ({comments.length})
                </p>

                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-primary" size={16} />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    {t("Нет комментариев", "No comments yet")}
                  </p>
                ) : (
                  <ScrollArea className="max-h-36 mb-3">
                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div
                          key={c.id.toString()}
                          className="p-2"
                          style={{
                            background: "oklch(0.13 0.02 240)",
                            border: "1px solid oklch(0.72 0.19 40 / 0.12)",
                            borderRadius: "var(--radius)",
                          }}
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
                                    <Trash2 size={9} />
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
                      <div
                        className="flex items-center gap-2 px-2 py-1"
                        style={{
                          background: "oklch(0.72 0.19 40 / 0.06)",
                          border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: "oklch(0.72 0.19 40)" }}
                        />
                        <span className="text-[10px] font-mono text-primary">
                          {formatVoiceTime(voiceRecordSecs)} / 1:00
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
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
                            ? t("Остановить и отправить", "Stop and send")
                            : t("Голосовой комментарий", "Voice comment")
                        }
                        className="h-8 w-8 flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                          background: voiceRecording
                            ? "oklch(0.72 0.19 40 / 0.1)"
                            : "transparent",
                          color: voiceRecording
                            ? "oklch(0.72 0.19 40)"
                            : "oklch(0.50 0.02 60)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        {addVoiceCommentMutation.isPending ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : voiceRecording ? (
                          <MicOff size={11} />
                        ) : (
                          <Mic size={11} />
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
                        className="text-xs h-8 flex-1"
                        style={{
                          background: "oklch(0.13 0.02 240)",
                          border: "1px solid oklch(0.72 0.19 40 / 0.3)",
                          borderRadius: "var(--radius)",
                        }}
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
                        className="h-8 text-xs font-bold"
                        style={{
                          background: "oklch(0.72 0.19 40)",
                          color: "oklch(0.06 0.01 240)",
                          borderRadius: "var(--radius)",
                        }}
                        data-ocid="builds.submit_button"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 size={11} className="animate-spin" />
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

              {/* Close */}
              <div className="mt-5 flex justify-end">
                <Button
                  variant="outline"
                  className="text-xs"
                  style={{
                    border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                    color: "oklch(0.72 0.19 40)",
                    background: "transparent",
                    borderRadius: "var(--radius)",
                  }}
                  onClick={() => {
                    setExpanded(false);
                    onClose?.();
                  }}
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

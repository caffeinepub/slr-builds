import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Smile,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "../backend";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const LS_KEY = "chat_last_seen_id";

function getLastSeenId(): bigint {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? BigInt(v) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function setLastSeenId(id: bigint) {
  localStorage.setItem(LS_KEY, id.toString());
}

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🤔",
  "😎",
  "😭",
  "😡",
  "🤩",
  "🥳",
  "😏",
  "👍",
  "👎",
  "👏",
  "🔥",
  "💀",
  "💯",
  "⚡",
  "🎯",
  "🏆",
  "⚔️",
  "❤️",
  "💔",
  "🎮",
  "🃏",
  "🎲",
  "🐉",
  "🦁",
  "🐺",
  "👑",
  "💎",
];

export function ChatPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [lastSeenId, setLastSeenIdState] = useState<bigint>(getLastSeenId);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const shortPrincipal = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : t("Гость", "Guest");

  const { data: profile } = useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const displayName = profile?.name || shortPrincipal;

  const { data: messages = [] } = useQuery({
    queryKey: ["chatMessages"],
    queryFn: async () => (await actor!.getChatMessages()) as ChatMessage[],
    enabled: !!actor,
    refetchInterval: 5000,
  });

  // When chat is opened, mark all messages as seen
  useEffect(() => {
    if (open && messages.length > 0) {
      const maxId = messages.reduce(
        (acc, m) => (m.id > acc ? m.id : acc),
        BigInt(0),
      );
      setLastSeenId(maxId);
      setLastSeenIdState(maxId);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    }
  }, [open, messages]);

  const unreadCount = messages.filter((m) => m.id > lastSeenId).length;

  const sendMutation = useMutation({
    mutationFn: (msg: string) => actor!.sendChatMessage(displayName, msg),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] }),
  });

  const sendVoiceMutation = useMutation({
    mutationFn: (audioData: string) =>
      actor!.sendVoiceChatMessage(displayName, audioData),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] }),
    onError: () =>
      toast.error(t("Ошибка отправки голосового", "Failed to send voice")),
  });

  const addFriendMutation = useMutation({
    mutationFn: (uid: string) => actor!.addFriend(uid),
    onSuccess: () => {
      toast.success(t("Запрос отправлен", "Friend request sent"));
      queryClient.invalidateQueries({ queryKey: ["myFriends"] });
    },
    onError: () => toast.error(t("Ошибка", "Error")),
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500 || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
    setText("");
    setShowEmoji(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => (prev + emoji).slice(0, 500));
  };

  const startRecording = async () => {
    if (!actor) {
      toast.error(
        t("Войдите для отправки голосовых", "Login to send voice messages"),
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        for (const t of stream.getTracks()) {
          t.stop();
        }
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(",")[1];
          sendVoiceMutation.mutate(b64);
        };
        reader.readAsDataURL(blob);
        setRecording(false);
        setRecordSecs(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          if (s + 1 >= 60) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error(t("Нет доступа к микрофону", "Microphone access denied"));
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="w-80 flex flex-col rounded-none bg-black neon-border"
          style={{ height: "460px" }}
          data-ocid="chat.panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/30">
            <span className="text-xs font-bold uppercase tracking-widest neon-text">
              {t("Чат", "Chat")}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {displayName}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                data-ocid="chat.close_button"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-2 py-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">
                {t("Нет сообщений", "No messages yet")}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id.toString()} className="mb-2 group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold text-primary">
                      {msg.authorName}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(
                        Number(msg.createdAt) / 1_000_000,
                      ).toLocaleTimeString()}
                    </span>
                    {identity && msg.authorName !== displayName && (
                      <button
                        type="button"
                        title={t("Добавить в друзья", "Add friend")}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        onClick={() => addFriendMutation.mutate(msg.authorName)}
                        data-ocid="chat.secondary_button"
                      >
                        <UserPlus size={11} />
                      </button>
                    )}
                  </div>
                  {msg.text.startsWith("VOICE:") ? (
                    <div className="bg-white/5 px-2 py-2 border-l-2 border-primary/40">
                      <audio
                        controls
                        style={{ height: "28px", width: "100%" }}
                        src={`data:audio/webm;base64,${msg.text.slice(6)}`}
                      >
                        <track kind="captions" />
                      </audio>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/90 bg-white/5 px-2 py-1 rounded-none border-l-2 border-primary/40">
                      {msg.text}
                    </p>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="grid grid-cols-10 gap-0.5 px-2 py-1 border-t border-primary/30 bg-black">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-base hover:bg-primary/20 rounded p-0.5 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 border-t border-primary/30">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-mono">
                {formatTime(recordSecs)} / 1:00
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {t("Запись...", "Recording...")}
              </span>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-1 p-2 border-t border-primary/30">
            <button
              type="button"
              onClick={() => {
                setShowEmoji((v) => !v);
              }}
              disabled={recording}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
              title={t("Смайлы", "Emojis")}
            >
              <Smile size={14} />
            </button>
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={sendVoiceMutation.isPending}
              className={`h-8 w-8 flex items-center justify-center transition-colors shrink-0 ${
                recording
                  ? "text-primary animate-pulse"
                  : "text-muted-foreground hover:text-primary"
              }`}
              title={
                recording ? t("Остановить", "Stop") : t("Голосовое", "Voice")
              }
            >
              {recording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <div className="flex-1 relative">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  recording
                    ? t("Запись...", "Recording...")
                    : t("Сообщение...", "Message...")
                }
                disabled={recording}
                className="text-xs h-8 bg-black border-primary/40 focus:border-primary rounded-none pr-10"
                data-ocid="chat.input"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                {text.length}/500
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending || recording}
              className="h-8 w-8 p-0 bg-primary hover:bg-primary/80 glow-red rounded-none"
              data-ocid="chat.submit_button"
            >
              <Send size={12} />
            </Button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-12 h-12 bg-black neon-border flex items-center justify-center hover:bg-primary/10 transition-colors rounded-none"
        data-ocid="chat.open_modal_button"
      >
        <MessageCircle size={20} className="text-primary" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full glow-red">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>
    </div>
  );
}

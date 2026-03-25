import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface ChatMessage {
  id: bigint;
  authorName: string;
  text: string;
  createdAt: bigint;
}

export function ChatPanel() {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayName = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : t("Гость", "Guest");

  const actorAny = actor as any;

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages"],
    queryFn: () => actorAny.getChatMessages(),
    enabled: !!actor && typeof actorAny.getChatMessages === "function",
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => actorAny.sendChatMessage(displayName, msg),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] }),
  });

  useEffect(() => {
    if (open) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    }
  }, [open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500 || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
    setText("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="w-80 flex flex-col rounded-none bg-black neon-border"
          style={{ height: "420px" }}
          data-ocid="chat.panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-primary/30">
            <span className="text-xs font-bold uppercase tracking-widest neon-text">
              {t("Чат", "Chat")}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="chat.close_button"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-2 py-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">
                {t("Нет сообщений", "No messages yet")}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id.toString()} className="mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold text-primary">
                      {msg.authorName}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(
                        Number(msg.createdAt) / 1_000_000,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 bg-white/5 px-2 py-1 rounded-none border-l-2 border-primary/40">
                    {msg.text}
                  </p>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-1 p-2 border-t border-primary/30">
            <div className="flex-1 relative">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("Сообщение...", "Message...")}
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
              disabled={!text.trim() || sendMutation.isPending}
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
        {messages.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full glow-red">
            {messages.length > 99 ? "99+" : messages.length}
          </Badge>
        )}
      </button>
    </div>
  );
}

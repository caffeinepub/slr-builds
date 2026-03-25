import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface OnlineUser {
  displayName: string;
  lastSeen: bigint;
}

export function OnlineCounter() {
  const { t } = useLang();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const displayName = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : t("Гость", "Guest");

  const actorAny = actor as any;

  const { data: onlineUsers = [] } = useQuery<OnlineUser[]>({
    queryKey: ["onlineUsers"],
    queryFn: () => actorAny.getOnlineUsers(),
    enabled: !!actor && typeof actorAny.getOnlineUsers === "function",
    refetchInterval: 30000,
  });

  // Heartbeat every 60s
  useEffect(() => {
    if (!actor || typeof actorAny.heartbeat !== "function") return;
    actorAny.onlineHeartbeat(displayName).catch(() => {});
    const id = setInterval(() => {
      actorAny.onlineHeartbeat(displayName).catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, [actor, actorAny, displayName]);

  const count = onlineUsers.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 border border-border rounded-none hover:border-primary/50 transition-colors"
          data-ocid="online.toggle"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400">{count}</span>
          <span className="text-muted-foreground hidden sm:inline">
            {t("онлайн", "online")}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-black border-primary/40 min-w-[160px] rounded-none"
        data-ocid="online.dropdown_menu"
      >
        {count === 0 ? (
          <DropdownMenuItem className="text-muted-foreground text-xs">
            {t("Никого нет", "Nobody online")}
          </DropdownMenuItem>
        ) : (
          onlineUsers.map((u) => (
            <DropdownMenuItem
              key={u.displayName}
              className="text-xs gap-2 cursor-default"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {u.displayName}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

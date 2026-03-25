import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useEffect } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface OnlineUser {
  displayName: string;
  lastSeen: bigint;
}

export function OnlineCounter() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const shortPrincipal = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}...`
    : "Гость";

  const { data: profile } = useQuery({
    queryKey: ["callerProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const displayName = profile?.name || shortPrincipal;

  const { data: onlineUsers = [] } = useQuery<OnlineUser[]>({
    queryKey: ["onlineUsers"],
    queryFn: () => actor!.getOnlineUsers(),
    enabled: !!actor,
    refetchInterval: 15000,
  });

  // Heartbeat every 60s
  useEffect(() => {
    if (!actor) return;
    actor.onlineHeartbeat(displayName).catch(() => {});
    const id = setInterval(() => {
      if (actor) actor.onlineHeartbeat(displayName).catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, [actor, displayName]);

  const count = onlineUsers.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105 focus:outline-none"
          style={{
            border: "1px solid oklch(0.71 0.16 75 / 0.6)",
            background: "oklch(0.71 0.16 75 / 0.08)",
            color: "oklch(0.71 0.16 75)",
            boxShadow: "0 0 10px oklch(0.71 0.16 75 / 0.12)",
          }}
          data-ocid="online.toggle"
        >
          <Users size={12} />
          <span className="hidden sm:inline">Кто онлайн</span>
          <span
            className="flex items-center gap-1"
            style={{ color: "#4ade80" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {count}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px] rounded-xl"
        style={{
          background: "oklch(0.17 0.043 252)",
          border: "1px solid oklch(0.71 0.16 75 / 0.4)",
          boxShadow: "0 8px 32px oklch(0.14 0.04 252 / 0.8)",
        }}
        data-ocid="online.dropdown_menu"
      >
        <DropdownMenuLabel
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.71 0.16 75)" }}
        >
          Онлайн: {count}
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          style={{ background: "oklch(0.71 0.16 75 / 0.2)" }}
        />
        {count === 0 ? (
          <DropdownMenuItem
            className="text-xs"
            style={{ color: "oklch(0.6 0.03 252)" }}
          >
            Никого нет онлайн
          </DropdownMenuItem>
        ) : (
          onlineUsers.map((u, i) => (
            <DropdownMenuItem
              key={`${u.displayName}-${i}`}
              className="text-xs gap-2 cursor-default"
              style={{ color: "oklch(0.9 0.02 252)" }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              {u.displayName || "Гость"}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

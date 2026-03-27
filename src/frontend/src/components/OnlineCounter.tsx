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
          className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 transition-all hover:opacity-80 focus:outline-none"
          style={{
            border: "1px solid oklch(0.72 0.19 40 / 0.35)",
            background: "transparent",
            color: "oklch(0.55 0.18 45)",
            borderRadius: "var(--radius)",
          }}
          data-ocid="online.toggle"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <Users size={10} />
          <span className="hidden sm:inline uppercase tracking-widest">
            Онлайн
          </span>
          <span className="font-mono">{count}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[160px]"
        style={{
          background: "oklch(1 0 0)",
          border: "1px solid oklch(0.72 0.19 40 / 0.4)",
          borderRadius: "var(--radius)",
        }}
        data-ocid="online.dropdown_menu"
      >
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Онлайн: {count}
        </DropdownMenuLabel>
        <DropdownMenuSeparator
          style={{ background: "oklch(0.72 0.19 40 / 0.2)" }}
        />
        {count === 0 ? (
          <DropdownMenuItem className="text-xs text-muted-foreground">
            Никого нет онлайн
          </DropdownMenuItem>
        ) : (
          onlineUsers.map((u, i) => (
            <DropdownMenuItem
              key={`${u.displayName}-${i}`}
              className="text-xs gap-2 cursor-default"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              {u.displayName || "Гость"}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

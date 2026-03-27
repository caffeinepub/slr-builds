import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { OnlineCounter } from "./OnlineCounter";
import { ProfileModal } from "./modals/ProfileModal";

interface Props {
  onNavigate: (page: "home" | "admin") => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: Props) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();
  const isLoggedIn = !!identity;
  const isConnected = !!actor;
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "oklch(0.06 0.01 240)",
          borderBottom: "1px solid oklch(0.72 0.19 40 / 0.4)",
        }}
      >
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo + status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="font-display font-bold text-xl uppercase tracking-widest text-primary transition-all hover:text-glow-orange"
              data-ocid="nav.link"
            >
              SAY<span className="text-foreground/70">-GG</span>
            </button>
            {/* СИСТЕМА АКТИВНА chip */}
            <span
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded"
              style={{
                background: isConnected
                  ? "oklch(0.3 0.15 150 / 0.15)"
                  : "oklch(0.3 0.1 30 / 0.15)",
                border: `1px solid ${isConnected ? "oklch(0.55 0.2 150 / 0.4)" : "oklch(0.55 0.18 30 / 0.4)"}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full pulse-dot"
                style={{
                  background: isConnected
                    ? "oklch(0.7 0.22 150)"
                    : "oklch(0.7 0.2 30)",
                }}
              />
              <span
                className="font-mono text-[9px] uppercase tracking-widest"
                style={{
                  color: isConnected
                    ? "oklch(0.65 0.18 150)"
                    : "oklch(0.65 0.18 30)",
                }}
              >
                {isConnected ? "АКТИВНА" : "ЗАГРУЗКА"}
              </span>
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              active={currentPage === "home"}
              onClick={() => onNavigate("home")}
            >
              СБОРКИ
            </NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <OnlineCounter />

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-foreground"
                    style={{
                      border: "1px solid oklch(0.72 0.19 40 / 0.5)",
                      background: "oklch(0.72 0.19 40 / 0.08)",
                      borderRadius: "var(--radius)",
                    }}
                    data-ocid="nav.open_modal_button"
                  >
                    <User size={14} />
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  style={{
                    background: "oklch(0.10 0.015 240)",
                    border: "1px solid oklch(0.72 0.19 40 / 0.4)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <DropdownMenuItem
                    onClick={() => setShowProfile(true)}
                    data-ocid="nav.link"
                  >
                    <User size={14} className="mr-2" />
                    Профиль / Мои сборки
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    style={{ background: "oklch(0.72 0.19 40 / 0.2)" }}
                  />
                  <DropdownMenuItem onClick={() => onNavigate("admin")}>
                    <Shield size={14} className="mr-2" />
                    Админ панель
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={clear}
                    className="text-destructive"
                    data-ocid="nav.delete_button"
                  >
                    <LogOut size={14} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="sm"
                className="font-bold uppercase tracking-wide glow-orange gap-2"
                style={{
                  background: "oklch(0.72 0.19 40)",
                  color: "oklch(0.06 0.01 240)",
                  borderRadius: "var(--radius)",
                }}
                data-ocid="nav.primary_button"
              >
                {isLoggingIn ? "Вход..." : "Войти"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}

function NavLink({
  children,
  active,
  onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-bold uppercase tracking-widest transition-colors relative pb-1 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      data-ocid="nav.link"
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{
            background: "oklch(0.72 0.19 40)",
            boxShadow: "0 0 8px oklch(0.72 0.19 40 / 0.8)",
          }}
        />
      )}
    </button>
  );
}

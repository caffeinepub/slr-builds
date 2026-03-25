import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Moon, Shield, Sun, User } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
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
  const { actor: _actor } = useActor();
  const { theme, toggleTheme } = useTheme();
  const isLoggedIn = !!identity;
  const [showProfile, setShowProfile] = useState(false);

  const isDark = theme === "dark";

  return (
    <>
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: isDark
            ? "oklch(0.14 0.04 252 / 0.97)"
            : "oklch(0.97 0.008 252 / 0.97)",
          borderBottom: "1px solid oklch(0.71 0.16 75 / 0.4)",
          boxShadow: "0 2px 20px oklch(0.71 0.16 75 / 0.08)",
        }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="font-display font-bold text-xl uppercase tracking-widest text-glow text-primary"
            data-ocid="nav.link"
          >
            SAY<span className="text-foreground">-GG</span>
          </button>

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
            {/* Online counter */}
            <OnlineCounter />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Светлая тема" : "Тёмная тема"}
              data-ocid="nav.toggle"
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-105"
              style={{
                border: "1px solid oklch(0.71 0.16 75 / 0.5)",
                background: "oklch(0.71 0.16 75 / 0.1)",
                color: "oklch(0.71 0.16 75)",
                minHeight: "32px",
              }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-xl text-foreground"
                    style={{
                      border: "1px solid oklch(0.71 0.16 75 / 0.5)",
                      background: "oklch(0.71 0.16 75 / 0.1)",
                    }}
                    data-ocid="nav.open_modal_button"
                  >
                    <User size={14} />
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl"
                  style={{
                    background: isDark
                      ? "oklch(0.17 0.043 252)"
                      : "oklch(0.95 0.01 252)",
                    border: "1px solid oklch(0.71 0.16 75 / 0.4)",
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
                    style={{ background: "oklch(0.71 0.16 75 / 0.2)" }}
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
                className="font-bold uppercase tracking-wide rounded-xl glow-gold gap-2"
                style={{
                  background: "oklch(0.71 0.16 75)",
                  color: "oklch(0.14 0.04 252)",
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
      className={`text-sm font-bold uppercase tracking-widest transition-colors relative pb-1 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      data-ocid="nav.link"
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{
            background: "oklch(0.71 0.16 75)",
            boxShadow: "0 0 8px oklch(0.71 0.16 75 / 0.8)",
          }}
        />
      )}
    </button>
  );
}

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
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { OnlineCounter } from "./OnlineCounter";
import { ProfileModal } from "./modals/ProfileModal";

interface Props {
  onNavigate: (page: "home" | "admin") => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: Props) {
  const { lang, setLang, t } = useLang();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor: _actor } = useActor();
  const isLoggedIn = !!identity;
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-black/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="font-display font-bold text-xl uppercase tracking-widest text-glow text-primary"
            data-ocid="nav.link"
          >
            SLR <span className="text-foreground">BUILDS</span>
          </button>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              active={currentPage === "home"}
              onClick={() => onNavigate("home")}
            >
              {t("СБОРКИ", "BUILDS")}
            </NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Online counter */}
            <OnlineCounter />

            {/* Lang toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "ru" ? "en" : "ru")}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded-none"
              data-ocid="nav.toggle"
            >
              {lang === "ru" ? "EN" : "RU"}
            </button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-primary/50 text-foreground rounded-none"
                    data-ocid="nav.open_modal_button"
                  >
                    <User size={14} />
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-black border-primary/40 rounded-none"
                >
                  <DropdownMenuItem
                    onClick={() => setShowProfile(true)}
                    data-ocid="nav.link"
                  >
                    <User size={14} className="mr-2" />
                    {t("Профиль / Мои сборки", "Profile / My Builds")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/20" />
                  <DropdownMenuItem onClick={() => onNavigate("admin")}>
                    <Shield size={14} className="mr-2" />
                    {t("Админ панель", "Admin Panel")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={clear}
                    className="text-destructive"
                    data-ocid="nav.delete_button"
                  >
                    <LogOut size={14} className="mr-2" />
                    {t("Выйти", "Logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                disabled={isLoggingIn}
                size="sm"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-wide glow-red rounded-none gap-2"
                data-ocid="nav.primary_button"
              >
                {isLoggingIn
                  ? t("Вход...", "Logging in...")
                  : t("Войти", "Login")}
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
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-red" />
      )}
    </button>
  );
}

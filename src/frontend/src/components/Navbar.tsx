import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import { useState } from "react";
import { useLang } from "../contexts/LangContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MyBuildsModal } from "./modals/MyBuildsModal";

interface Props {
  onNavigate: (page: "home" | "admin") => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: Props) {
  const { lang, setLang, t } = useLang();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor: _actor } = useActor();
  const isLoggedIn = !!identity;
  const [showMyBuilds, setShowMyBuilds] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="font-display font-bold text-xl uppercase tracking-widest text-glow text-primary"
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
            {isLoggedIn && (
              <NavLink
                active={currentPage === "admin"}
                onClick={() => onNavigate("admin")}
              >
                {t("АДМИН", "ADMIN")}
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Lang toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "ru" ? "en" : "ru")}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded"
            >
              {lang === "ru" ? "EN" : "RU"}
            </button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 border-primary/50 text-foreground"
                  >
                    <User size={14} />
                    <ChevronDown size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border"
                >
                  <DropdownMenuItem onClick={() => setShowMyBuilds(true)}>
                    {t("Мои сборки", "My Builds")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("admin")}>
                    <Shield size={14} className="mr-2" />
                    {t("Админ панель", "Admin Panel")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={clear}
                    className="text-destructive"
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
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold uppercase tracking-wide glow-red"
              >
                {isLoggingIn
                  ? t("Вход...", "Logging in...")
                  : t("Войти", "Login")}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {showMyBuilds && <MyBuildsModal onClose={() => setShowMyBuilds(false)} />}
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
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-red" />
      )}
    </button>
  );
}

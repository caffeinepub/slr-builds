import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { ChatPanel } from "./components/ChatPanel";
import { Navbar } from "./components/Navbar";
import { LangProvider } from "./contexts/LangContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const [page, setPage] = useState<"home" | "admin">(
    window.location.pathname === "/admin" ? "admin" : "home",
  );

  return (
    <ThemeProvider>
      <LangProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar onNavigate={setPage} currentPage={page} />
          {page === "home" ? <HomePage /> : <AdminPage />}
          <ChatPanel />
          <Toaster />
        </div>
      </LangProvider>
    </ThemeProvider>
  );
}

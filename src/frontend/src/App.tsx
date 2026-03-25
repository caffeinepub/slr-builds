import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { LangProvider } from "./contexts/LangContext";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const [page, setPage] = useState<"home" | "admin">(
    window.location.pathname === "/admin" ? "admin" : "home",
  );

  return (
    <LangProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar onNavigate={setPage} currentPage={page} />
        {page === "home" ? <HomePage /> : <AdminPage />}
        <Toaster />
      </div>
    </LangProvider>
  );
}

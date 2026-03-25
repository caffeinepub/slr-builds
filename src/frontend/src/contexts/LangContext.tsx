import { type ReactNode, createContext, useContext, useState } from "react";

type Lang = "ru" | "en";

type T = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ru: string, en: string) => string;
};

const LangContext = createContext<T | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const t = (ru: string, en: string) => (lang === "ru" ? ru : en);
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang outside LangProvider");
  return ctx;
}

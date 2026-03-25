import { type ReactNode, createContext, useContext } from "react";

type Lang = "ru";

type T = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (ru: string, en: string) => string;
};

const LangContext = createContext<T | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const lang: Lang = "ru";
  const setLang = (_l: Lang) => {};
  const t = (ru: string, _en: string) => ru;
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

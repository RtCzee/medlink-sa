"use client";

import * as React from "react";

export type LangCode = "en" | "zu" | "af" | "st";

export type Lang = {
  code: LangCode;
  label: string;
  native: string;
  flag: string;
};

export const LANGUAGES: Lang[] = [
  { code: "en", label: "English", native: "English", flag: "🇿🇦" },
  { code: "zu", label: "isiZulu", native: "isiZulu", flag: "🇿🇦" },
  { code: "af", label: "Afrikaans", native: "Afrikaans", flag: "🇿🇦" },
  { code: "st", label: "Sesotho", native: "Sesotho", flag: "🇿🇦" },
];

const DICT: Record<LangCode, Record<string, string>> = {
  en: {
    "nav.signin": "Sign in",
    "nav.getstarted": "Get started",
    "nav.dashboard": "Dashboard",
    "nav.signout": "Sign out",
    "nav.explore": "Explore",
    "nav.service": "Service",
    "nav.faq": "FAQ",
    "hero.kicker": "South Africa's national health network",
    "hero.title1": "Modern",
    "hero.title2": "Healthcare,",
    "hero.title3": "Connected.",
    "hero.sub": "MedLink SA bridges the gap between patients and healthcare providers through digital prescriptions, appointment management, medical records, and intelligent healthcare administration.",
    "hero.cta1": "Get started",
    "hero.cta2": "Sign in",
    "hero.cta3": "Go to your dashboard",
    "hero.hint": "drag to rotate · tap to poke",
    "hero.scroll": "scroll to explore",
    "feat.aid": "Medical Aid Management",
    "feat.inv": "Inventory Tracking",
    "feat.med": "Medication Reminders",
  },
  zu: {
    "nav.signin": "Ngena ngemvume",
    "nav.getstarted": "Qala",
    "nav.dashboard": "Ideshibhodi",
    "nav.signout": "Phuma",
    "nav.explore": "Hlola",
    "nav.service": "Isevisi",
    "nav.faq": "Imibuzo",
    "hero.kicker": "Inethiwekhi yezempilo yavelonkhe yaseNingizimu Afrika",
    "hero.title1": "Ize",
    "hero.title2": "Yezempilo",
    "hero.title3": "Ehlanganiswe.",
    "hero.sub": "I-MedLink SA ixhumanisa abaguli nabahlinzeki bezempilo ngezensimo eziguqukayo, ekuphateni izikhombe, kanye nokulawulwa okuhlakaniphile kwezempilo.",
    "hero.cta1": "Qala",
    "hero.cta2": "Ngena ngemvume",
    "hero.cta3": "Iya kudeshibhodi yakho",
    "hero.hint": "hudula ukuze ujikele · thepha ukuze ukhombe",
    "hero.scroll": "skrolela ukuze uhlule",
    "feat.aid": "Ekuphathweni Kwezempilo",
    "feat.inv": "Ukulandela Isitoreji",
    "feat.med": "Iinkumbuzo Zemithi",
  },
  af: {
    "nav.signin": "Teken in",
    "nav.getstarted": "Begin",
    "nav.dashboard": "Paneel",
    "nav.signout": "Teken uit",
    "nav.explore": "Verken",
    "nav.service": "Diens",
    "nav.faq": "Vrae",
    "hero.kicker": "Suid-Afrika se nasionale gesondheidsnetwerk",
    "hero.title1": "Moderne",
    "hero.title2": "Gesondheidsorg,",
    "hero.title3": "Gekonnekteer.",
    "hero.sub": "MedLink SA oorbrug die gaping tussen pasiënte en gesondheidsorgverskaffers deur digitale voorskrifte, afspraakbestuur, mediese rekords, en intelligente gesondheidsadministrasie.",
    "hero.cta1": "Begin",
    "hero.cta2": "Teken in",
    "hero.cta3": "Gaan na jou paneel",
    "hero.hint": "sleep om te draai · tik om te por",
    "hero.scroll": "rol om te verken",
    "feat.aid": "Mediese Hulp Bestuur",
    "feat.inv": "Voorraad Opsporing",
    "feat.med": "Medikasie Herinnerings",
  },
  st: {
    "nav.signin": "Kena",
    "nav.getstarted": "Qala",
    "nav.dashboard": "Dashepoto",
    "nav.signout": "Tswa",
    "nav.explore": "Hlahloba",
    "nav.service": "Tšebeletso",
    "nav.faq": "Dipotso",
    "hero.kicker": "Neteweke ya bophelo bosetšhaba ya Afrika Borwa",
    "hero.title1": "Bophelo",
    "hero.title2": "Boetapele,",
    "hero.title3": "Bo hokahantšwe.",
    "hero.sub": "MedLink SA e hokahanya balwetši le ba fangang bophelo ka dikanelo tsa dijithale, taolo ya dipontšho, direkoto tsa bophelo, le taolo e hlakaphalang ya bophelo.",
    "hero.cta1": "Qala",
    "hero.cta2": "Kena",
    "hero.cta3": "Eya dashepoteng ya hao",
    "hero.hint": "tanya ho fihlella · kgotla ho baka",
    "hero.scroll": "skrolela ho hlahloba",
    "feat.aid": "Taolo ya Thuso ya Bophelo",
    "feat.inv": "Tlhatlhobo ya Polokeho",
    "feat.med": "Dipotso tsa Meriana",
  },
};

const LANG_KEY = "medlink-sa-lang";

type LangCtx = {
  lang: LangCode;
  setLang: (c: LangCode) => void;
  t: (key: string) => string;
};

const Ctx = React.createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LangCode>("en");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as LangCode | null;
      if (saved && DICT[saved]) setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = React.useCallback((c: LangCode) => {
    setLangState(c);
    try {
      localStorage.setItem(LANG_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const t = React.useCallback(
    (key: string) => DICT[lang][key] ?? DICT.en[key] ?? key,
    [lang]
  );

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

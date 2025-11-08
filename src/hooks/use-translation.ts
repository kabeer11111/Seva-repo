import { useState, useEffect, useCallback } from "react";
import { translations } from "@/lib/translations";

export const useTranslation = (initialLang: string) => {
  const [lang, setLang] = useState(initialLang);
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    setLang(initialLang);
    setLangReady(true);
  }, [initialLang]);

  const t = useCallback((key: keyof (typeof translations)["en-US"], replacements: Record<string, string> = {}) => {
    const langKey = lang as keyof typeof translations;
    let translation = translations[langKey]?.[key] || translations["en-US"][key] || key;

    for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    }
    
    return translation;
  }, [lang]);

  return { t, setLang, lang, langReady };
};

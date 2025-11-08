import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SevaSetuLogo } from "@/components/icons";
import ChatSettings from "./chat-settings";
import type { Language } from "@/types";
import { useTranslation } from "@/hooks/use-translation";

interface ChatHeaderProps {
  availableLanguages: Language[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function ChatHeader({
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
}: ChatHeaderProps) {
  const { t } = useTranslation(selectedLanguage);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <SevaSetuLogo className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-headline font-bold text-primary">
          {t('appName')}
        </h1>
      </div>
      <ChatSettings
        availableLanguages={availableLanguages}
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
      >
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">{t('settings')}</span>
        </Button>
      </ChatSettings>
    </div>
  );
}

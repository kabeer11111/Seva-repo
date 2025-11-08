
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { Language } from "@/types";
import { translations } from "@/lib/translations";
import { Volume2 } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onLanguageSelect: (language: string) => void;
  onPlayInstruction: (language: string) => void;
  availableLanguages: Language[];
  onClose: () => void;
  onStartWithLanguage: (language: string) => void;
}

export default function WelcomeModal({
  isOpen,
  onLanguageSelect,
  onPlayInstruction,
  availableLanguages,
  onClose,
  onStartWithLanguage,
}: WelcomeModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const t = (lang: string, key: keyof typeof translations['en-US']) => {
    return translations[lang as keyof typeof translations]?.[key] || translations['en-US'][key];
  };
  
  const handleSelectAndClose = (lang: string) => {
    onStartWithLanguage(lang);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedLanguage(null);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md w-[90vw] rounded-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedLanguage ? t(selectedLanguage, 'instructionsTitle') : 'Choose Your Language'}
          </DialogTitle>
          <DialogDescription>
            {selectedLanguage ? '' : 'Please select your preferred language.'}
          </DialogDescription>
        </DialogHeader>

        {!selectedLanguage ? (
          <RadioGroup onValueChange={setSelectedLanguage} className="py-4 space-y-2">
            {availableLanguages.map((lang) => (
              <div key={lang.value} className="flex items-center space-x-2">
                <RadioGroupItem value={lang.value} id={lang.value} />
                <Label htmlFor={lang.value} className="text-base">
                  {lang.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="py-4 space-y-4">
            <div className="prose prose-sm dark:prose-invert max-h-[40vh] overflow-y-auto">
              <p>{t(selectedLanguage, 'instructions')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => onPlayInstruction(selectedLanguage)}>
                <Volume2 className="h-5 w-5" />
              </Button>
              <span>{t(selectedLanguage, 'listenToInstructions')}</span>
            </div>
            <Button className="w-full" onClick={() => handleSelectAndClose(selectedLanguage)}>
              {t(selectedLanguage, 'getStarted')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

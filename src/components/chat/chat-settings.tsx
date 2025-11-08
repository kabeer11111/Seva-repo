"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Language } from "@/types";
import { useTranslation } from "@/hooks/use-translation";

interface ChatSettingsProps {
  children: React.ReactNode;
  availableLanguages: Language[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function ChatSettings({
  children,
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
}: ChatSettingsProps) {
  const [currentSelection, setCurrentSelection] = useState(selectedLanguage);
  const { t } = useTranslation(selectedLanguage);

  const handleSave = () => {
    onLanguageChange(currentSelection);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings')}</DialogTitle>
          <DialogDescription>
            {t('settingsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={currentSelection}
            onValueChange={setCurrentSelection}
            className="space-y-2"
          >
            {availableLanguages.map((lang) => (
              <div key={lang.value} className="flex items-center space-x-2">
                <RadioGroupItem value={lang.value} id={lang.value} />
                <Label htmlFor={lang.value} className="text-base">
                  {lang.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('cancel')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>{t('save')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

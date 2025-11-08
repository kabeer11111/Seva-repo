
import type { Message, Language, PatientDetails, Prescription } from "@/types";
import ChatHeader from "./chat-header";
import ChatMessages from "./chat-messages";
import ChatInput from "./chat-input";
import PrescriptionView from "./prescription-view";
import { Card } from "../ui/card";
import { useTranslation } from "@/hooks/use-translation";

interface ChatLayoutProps {
  messages: Message[];
  isAiTyping: boolean;
  onSendMessage: (text: string, imageUrl?: string) => void;
  onSendVoiceMessage: (audioDataUri: string, imageUrl?: string) => void;
  onGeneratePrescription: () => void;
  onFindHospitals: () => void;
  isDiagnosisDone: boolean;
  availableLanguages: Language[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  prescription: Prescription | null;
  isPrescriptionModalOpen: boolean;
  onPrescriptionModalOpenChange: (isOpen: boolean) => void;
  onReplayAudio: (audioUri: string) => void;
  disableInput?: boolean;
  onStopAudio: () => void;
  patientDetails: PatientDetails | null;
}

export default function ChatLayout({
  messages,
  isAiTyping,
  onSendMessage,
  onSendVoiceMessage,
  onGeneratePrescription,
  onFindHospitals,
  isDiagnosisDone,
  availableLanguages,
  selectedLanguage,
  onLanguageChange,
  prescription,
  isPrescriptionModalOpen,
  onPrescriptionModalOpenChange,
  onReplayAudio,
  disableInput,
  onStopAudio,
  patientDetails,
}: ChatLayoutProps) {
  const { t } = useTranslation(selectedLanguage);
  return (
    <div className="relative flex h-full w-full max-w-4xl flex-col">
      <Card className="flex h-full flex-col shadow-lg rounded-none md:rounded-xl">
        <ChatHeader
          availableLanguages={availableLanguages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
        <ChatMessages messages={messages} isAiTyping={isAiTyping} onReplayAudio={onReplayAudio}/>
        <ChatInput
          onSendMessage={onSendMessage}
          onSendVoiceMessage={onSendVoiceMessage}
          isAiTyping={isAiTyping}
          onGeneratePrescription={onGeneratePrescription}
          onFindHospitals={onFindHospitals}
          isDiagnosisDone={isDiagnosisDone}
          selectedLanguage={selectedLanguage}
          disableInput={disableInput}
          onStopAudio={onStopAudio}
        />
        <div className="p-2 text-center text-xs text-muted-foreground hidden md:block">
          {t('disclaimer')}
        </div>
      </Card>
      {prescription && (
        <PrescriptionView
          prescription={prescription}
          isOpen={isPrescriptionModalOpen}
          onOpenChange={onPrescriptionModalOpenChange}
          selectedLanguage={selectedLanguage}
          patientDetails={patientDetails}
        />
      )}
    </div>
  );
}

    

    


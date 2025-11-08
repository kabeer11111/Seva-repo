
"use client";

import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import ChatLayout from "@/components/chat/chat-layout";
import {
  getAiResponse,
  generatePrescriptionAction,
  processVoiceInput,
  processTextToVoice,
} from "./actions";
import type { Message, Language, PatientDetails, Prescription } from "@/types";
import { useTranslation } from "@/hooks/use-translation";
import WelcomeModal from "@/components/welcome-modal";
import { translations } from "@/lib/translations";
import { GeneratePrescriptionOutput } from "@/ai/flows/automated-prescription-generation";

const languages: Language[] = [
  { value: "en-US", label: "English" },
  { value: "hi-IN", label: "Hindi" },
  { value: "mr-IN", label: "Marathi" },
  { value: "ta-IN", label: "Tamil" },
  { value: "bn-IN", label: "Bengali" },
];

export default function Home() {
  const [language, setLanguage] = useState<string>(languages[0].value);
  const { t, setLang, langReady } = useTranslation(language);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [awaitingPatientDetail, setAwaitingPatientDetail] = useState<keyof PatientDetails | "done" | null>(null);
  const [isDiagnosisDone, setIsDiagnosisDone] = useState(false);

  useEffect(() => {
    const savedDetails = localStorage.getItem("patientDetails");
    if (savedDetails) {
        setPatientDetails(JSON.parse(savedDetails));
    }
    const savedLanguage = localStorage.getItem("selectedLanguage");

    if (savedLanguage) {
      setLanguage(savedLanguage);
      setLang(savedLanguage);
    }
    // Only show welcome modal if there are no patient details
    if (!savedDetails) {
      setIsWelcomeModalOpen(true);
    } else {
      setIsWelcomeModalOpen(false);
      // If we have details, we can skip the intro flow
      if (messages.length === 0) {
        const welcomeText = t('welcomeBack', { name: JSON.parse(savedDetails).name });
        addMessage({ id: nanoid(), role: 'ai', text: welcomeText });
      }
      setAwaitingPatientDetail("done");
    }
  }, [setLang]);


  const startPatientDetailsFlow = async (lang: string, playAudioOnStart: boolean) => {
    stopAudio();
    setIsDiagnosisDone(false);
    localStorage.removeItem("patientDetails");
    const welcomeMessage = translations[lang as keyof typeof translations]?.welcomeMessage || translations['en-US'].welcomeMessage;
    const askName = translations[lang as keyof typeof translations]?.askName || translations['en-US'].askName;
    const initialText = `${welcomeMessage}\n\n${askName}`;

    setMessages([]);
    setPatientDetails(null);
    setAwaitingPatientDetail("name");
    setIsAiTyping(true);
    try {
      if (playAudioOnStart) {
        const audioResult = await processTextToVoice({ text: initialText, language: lang });
        const initialMessage: Message = { id: nanoid(), role: "ai", text: initialText, audioUri: audioResult.audioDataUri };
        setMessages([initialMessage]);
        if (audioResult.audioDataUri) {
          playAudio(audioResult.audioDataUri);
        }
      } else {
         const initialMessage: Message = { id: nanoid(), role: "ai", text: initialText };
         setMessages([initialMessage]);
      }
    } catch (error) {
      console.error("Error generating TTS for initial message:", error);
      setMessages([{ id: nanoid(), role: "ai", text: initialText }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  useEffect(() => {
    if (language) {
      setLang(language);
    }
  }, [language, setLang]);

  const handleLanguageChange = (newLanguage: string) => {
    stopAudio();
    setLanguage(newLanguage);
    localStorage.setItem("selectedLanguage", newLanguage);
    setLang(newLanguage);
    startPatientDetailsFlow(newLanguage, true);
    setIsWelcomeModalOpen(false);
  };

  const handlePatientDetails = async (userInput: string) => {
    setIsAiTyping(true);
    let currentDetails = patientDetails || { name: "", age: "", phone: "", location: "" };
    let nextStep: keyof PatientDetails | "done" | null = null;
    let responseText = "";

    const detailKey = awaitingPatientDetail as keyof PatientDetails;
    
    if (detailKey && detailKey !== "done") {
        (currentDetails as any)[detailKey] = userInput;
    }

    if (awaitingPatientDetail === "name") {
      responseText = t('askAge');
      nextStep = "age";
    } else if (awaitingPatientDetail === "age") {
      responseText = t('askPhone');
      nextStep = "phone";
    } else if (awaitingPatientDetail === "phone") {
        responseText = t('askLocation');
        nextStep = "location";
    } else if (awaitingPatientDetail === "location") {
      responseText = t('thanksPatientDetails', { name: currentDetails.name });
      nextStep = "done";
      setPatientDetails(currentDetails);
      localStorage.setItem("patientDetails", JSON.stringify(currentDetails));
    }
    
    setPatientDetails(currentDetails);
    setAwaitingPatientDetail(nextStep);

    try {
        const audioResult = await processTextToVoice({ text: responseText, language });
        const aiMessage = { id: nanoid(), role: "ai" as const, text: responseText, audioUri: audioResult.audioDataUri };
        addMessage(aiMessage);
        if (aiMessage.audioUri) {
            playAudio(aiMessage.audioUri);
        }
    } catch (error) {
        console.error("Error generating TTS for patient details:", error);
        addMessage({ id: nanoid(), role: "ai", text: responseText });
    } finally {
        setIsAiTyping(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return;
    
    const userMessage: Message = { id: nanoid(), role: "user", text, imageUrl };
    addMessage(userMessage);

    if (awaitingPatientDetail && awaitingPatientDetail !== "done") {
        await handlePatientDetails(text);
        return;
    }
    
    setIsAiTyping(true);

    try {
      const chatHistory = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
      const aiResult = await getAiResponse({
        symptoms: text,
        language,
        chatHistory,
        imageDataUri: imageUrl,
        patientDetails: patientDetails ? JSON.stringify(patientDetails) : undefined,
      });

      const aiMessage: Message = {
        id: nanoid(),
        role: "ai",
        text: aiResult.responseText,
        audioUri: aiResult.responseAudioUri,
      };
      addMessage(aiMessage);
      setIsDiagnosisDone(true);
      if (aiMessage.audioUri) {
        playAudio(aiMessage.audioUri);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: t('error'),
        description: t('aiError'),
        variant: "destructive",
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendVoiceMessage = async (audioDataUri: string, imageUrl?: string) => {
    const tempUserMessageId = nanoid();
    addMessage({ id: tempUserMessageId, role: "user", text: t('processingVoice'), audioUri: audioDataUri, imageUrl });
    
    setIsAiTyping(true);
    let transcribedText = '';
    try {
        const result = await processVoiceInput({ 
          audioDataUri, 
          language,
          chatHistory: messages.map((m) => `${m.role}: ${m.text}`).join("\n"),
          imageDataUri: imageUrl,
          patientDetails: patientDetails ? JSON.stringify(patientDetails) : undefined,
        });
        transcribedText = result.transcribedText;
        setMessages(prev => prev.map(m => m.id === tempUserMessageId ? {...m, text: transcribedText} : m));

        if (awaitingPatientDetail && awaitingPatientDetail !== "done") {
            await handlePatientDetails(transcribedText);
            return;
        }

        const aiMessage: Message = {
          id: nanoid(),
          role: "ai",
          text: result.responseText,
          audioUri: result.responseAudioUri,
        };
        addMessage(aiMessage);
        setIsDiagnosisDone(true);
        if (aiMessage.audioUri) {
          playAudio(aiMessage.audioUri);
        }

    } catch (error) {
        console.error("Error processing voice input:", error);
         toast({
            title: t('error'),
            description: t('voiceError'),
            variant: "destructive",
        });
        setMessages(prev => prev.filter(m => m.id !== tempUserMessageId));
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleGeneratePrescription = async () => {
    setIsAiTyping(true);
    try {
      const conversationHistory = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
      const lastAiMessage = messages.filter((m) => m.role === "ai").pop()?.text || "No diagnosis found.";
      
      const result = await generatePrescriptionAction({
        conversationHistory,
        suggestedDiagnosis: lastAiMessage,
        patientLanguage: language,
      });

      setPrescription({
        ...result,
        date: new Date().toISOString(),
      });
      setIsPrescriptionModalOpen(true);
    } catch (error) {
      console.error("Error generating prescription:", error);
      toast({
        title: t('error'),
        description: t('prescriptionError'),
        variant: "destructive",
      });
    } finally {
      setIsAiTyping(false);
    }
  };
  
  const handleFindHospitals = () => {
    const lastDiagnosisMessage = messages
      .filter((m) => m.role === "ai" && m.text)
      .pop();
    
    const diagnosis = lastDiagnosisMessage?.text.split('\n\n')[0].replace(/^Diagnosis:\s*/, '').trim() || "health issue";

    const query = `${diagnosis} hospitals and clinics`;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&ll=${latitude},${longitude}`;
          window.open(url, "_blank");
        },
        (error) => {
          console.error("Error getting location:", error);
          let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
          if (patientDetails?.location) {
            url += `+near+${encodeURIComponent(patientDetails.location)}`;
          } else {
             toast({
              title: t('locationError'),
              description: t('locationErrorDescription'),
              variant: "destructive",
            });
          }
          window.open(url, "_blank");
        }
      );
    } else {
        let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        if (patientDetails?.location) {
          url += `+near+${encodeURIComponent(patientDetails.location)}`;
        } else {
           toast({
              title: t('locationError'),
              description: t('locationErrorDescription'),
              variant: "destructive",
            });
        }
        window.open(url, "_blank");
    }
  };

  const playAudio = (audioUri: string) => {
    if (audioPlayerRef.current) {
      stopAudio(); // Stop any currently playing audio
      audioPlayerRef.current.src = audioUri;
      const playPromise = audioPlayerRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name !== 'AbortError') {
            console.error("Audio playback failed:", e)
          }
        });
      }
    }
  };

  const stopAudio = () => {
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
  }

  const isInputDisabled = () => {
    return isAiTyping || (awaitingPatientDetail !== null && awaitingPatientDetail !== "done");
  }

  if (!langReady) {
    return null; // Or a loading spinner
  }

  return (
    <main className="flex h-dvh flex-col items-center justify-center bg-background">
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onLanguageSelect={handleLanguageChange}
        availableLanguages={languages}
        onPlayInstruction={async (lang) => {
          stopAudio();
          const text = translations[lang as keyof typeof translations]?.instructions;
          if (text) {
            try {
              setIsAiTyping(true);
              const result = await processTextToVoice({ text, language: lang });
              if (result.audioDataUri) {
                playAudio(result.audioDataUri);
              }
            } catch (error) {
              console.error("Error playing instruction:", error);
            } finally {
              setIsAiTyping(false);
            }
          }
        }}
        onClose={() => {
          setIsWelcomeModalOpen(false);
          // If user closes without selecting, start with default language
          if (!patientDetails && messages.length === 0) {
            startPatientDetailsFlow(language, false);
          }
        }}
        onStartWithLanguage={handleLanguageChange}
      />
      {!isWelcomeModalOpen && (
        <ChatLayout
          messages={messages}
          isAiTyping={isAiTyping}
          onSendMessage={handleSendMessage}
          onSendVoiceMessage={handleSendVoiceMessage}
          onGeneratePrescription={handleGeneratePrescription}
          onFindHospitals={handleFindHospitals}
          isDiagnosisDone={isDiagnosisDone}
          availableLanguages={languages}
          selectedLanguage={language}
          onLanguageChange={(lang) => {
            stopAudio();
            setLanguage(lang);
            localStorage.setItem("selectedLanguage", lang);
            setLang(lang);
            startPatientDetailsFlow(lang, true);
          }}
          prescription={prescription}
          isPrescriptionModalOpen={isPrescriptionModalOpen}
          onPrescriptionModalOpenChange={setIsPrescriptionModalOpen}
          onReplayAudio={playAudio}
          disableInput={isAiTyping && (!awaitingPatientDetail || awaitingPatientDetail === 'done')}
          onStopAudio={stopAudio}
          patientDetails={patientDetails}
        />
      )}
       <audio ref={audioPlayerRef} className="hidden" />
    </main>
  );
}

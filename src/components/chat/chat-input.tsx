"use client";

import { useState, useRef } from "react";
import { Send, Mic, FileText, Square, Paperclip, X, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import Image from "next/image";

interface ChatInputProps {
  onSendMessage: (text: string, imageUrl?: string) => void;
  onSendVoiceMessage: (audioDataUri: string, imageUrl?: string) => void;
  isAiTyping: boolean;
  onGeneratePrescription: () => void;
  onFindHospitals: () => void;
  isDiagnosisDone: boolean;
  selectedLanguage: string;
  disableInput?: boolean;
  onStopAudio: () => void;
}

export default function ChatInput({
  onSendMessage,
  onSendVoiceMessage,
  isAiTyping,
  onGeneratePrescription,
  onFindHospitals,
  isDiagnosisDone,
  selectedLanguage,
  disableInput,
  onStopAudio,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation(selectedLanguage);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSendClick = () => {
    if (text.trim() || imagePreview) {
      onSendMessage(text, imagePreview || undefined);
      setText("");
      setImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const startRecording = async () => {
    onStopAudio();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64String = reader.result as string;
            onSendVoiceMessage(base64String, imagePreview || undefined);
            setImagePreview(null);
            if (imageInputRef.current) {
              imageInputRef.current.value = "";
            }
          };
          audioChunksRef.current = [];
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({
          title: t('micError'),
          description: t('micErrorDescription'),
          variant: "destructive",
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isDisabled = isAiTyping || isRecording || disableInput;

  return (
    <div className="p-2 md:p-4 border-t bg-background/80 backdrop-blur-sm md:rounded-b-xl">
      {imagePreview && (
          <div className="relative w-20 h-20 mb-2 ml-2">
            <Image
              src={imagePreview}
              alt="Image preview"
              fill
              className="rounded-md object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 bg-gray-900/50 text-white rounded-full"
              onClick={() => {
                setImagePreview(null);
                if (imageInputRef.current) {
                  imageInputRef.current.value = "";
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      <div className="flex items-start gap-2">
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <Button
          onClick={() => imageInputRef.current?.click()}
          disabled={isDisabled}
          size="icon"
          variant="outline"
          aria-label={t('attachImage')}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Textarea
          placeholder={t('sendMessagePlaceholder')}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex-1 resize-none max-h-24 md:max-h-32 transition-all duration-200"
          disabled={isDisabled}
        />
        <Button
          onClick={handleSendClick}
          disabled={(!text.trim() && !imagePreview) || isDisabled}
          size="icon"
          className="bg-primary hover:bg-primary/90"
          aria-label={t('sendMessage')}
        >
          <Send className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleMicClick}
          disabled={isAiTyping || disableInput}
          size="icon"
          variant={isRecording ? "destructive" : "outline"}
          className={cn(isRecording && "bg-red-500 hover:bg-red-600 text-white")}
          aria-label={isRecording ? t('stopRecording') : t('startRecording')}
        >
          {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      <Button
          onClick={onGeneratePrescription}
          disabled={isAiTyping || !isDiagnosisDone}
          variant="accent"
          className="w-full bg-accent hover:bg-accent/90"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('generatePrescription')}
      </Button>
      <Button
          onClick={onFindHospitals}
          disabled={isAiTyping || !isDiagnosisDone}
          variant="accent"
          className="w-full bg-accent hover:bg-accent/90"
        >
          <Hospital className="mr-2 h-4 w-4" />
          {t('findHospitals')}
      </Button>
      </div>
    </div>
  );
}

    
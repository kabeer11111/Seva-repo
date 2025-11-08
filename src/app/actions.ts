"use server";

import { z } from "zod";
import { analyzeSymptoms } from "@/ai/flows/multilingual-symptom-analysis";
import { generatePrescription } from "@/ai/flows/automated-prescription-generation";
import { voiceEnabledSymptomInput, textToVoice } from "@/ai/flows/voice-enabled-symptom-input";
import { analyzeConversationHistory } from "@/ai/flows/ai-conversation-history-analysis";

const getAiResponseSchema = z.object({
  symptoms: z.string(),
  language: z.string(),
  chatHistory: z.string().optional(),
  imageDataUri: z.string().optional(),
  patientDetails: z.string().optional(),
});

export async function getAiResponse(
  input: z.infer<typeof getAiResponseSchema>
) {
  const validatedInput = getAiResponseSchema.parse(input);
  const result = await analyzeSymptoms(validatedInput);
  return result;
}

const generatePrescriptionActionSchema = z.object({
  conversationHistory: z.string(),
  suggestedDiagnosis: z.string(),
  patientLanguage: z.string(),
});

export async function generatePrescriptionAction(
  input: z.infer<typeof generatePrescriptionActionSchema>
) {
  const validatedInput = generatePrescriptionActionSchema.parse(input);
  const result = await generatePrescription(validatedInput);
  return result;
}

const processVoiceInputSchema = z.object({
  audioDataUri: z.string(),
  language: z.string(),
  chatHistory: z.string().optional(),
  imageDataUri: z.string().optional(),
  patientDetails: z.string().optional(),
});

export async function processVoiceInput(
  input: z.infer<typeof processVoiceInputSchema>
) {
  const { audioDataUri, language, ...rest } = processVoiceInputSchema.parse(input);
  
  // First, transcribe the audio
  const { text: transcribedText } = await ai.generate({
      prompt: [
        {media: {url: audioDataUri}},
        {text: `Transcribe the audio. The language is ${language}.`},
      ],
    });

  // Then, analyze the symptoms from the transcribed text
  const aiResult = await analyzeSymptoms({
    symptoms: transcribedText,
    language,
    ...rest
  });

  return {
    transcribedText,
    ...aiResult
  };
}


const processTextToVoiceSchema = z.object({
    text: z.string(),
    language: z.string(),
});

export async function processTextToVoice(
    input: z.infer<typeof processTextToVoiceSchema>
) {
    const validatedInput = processTextToVoiceSchema.parse(input);
    const result = await textToVoice(validatedInput);
    return result;
}

const getFollowUpSuggestionsSchema = z.object({
  conversationHistory: z.string(),
  currentSymptoms: z.string(),
  language: z.string(),
});

export async function getFollowUpSuggestions(
  input: z.infer<typeof getFollowUpSuggestionsSchema>
) {
  const validatedInput = getFollowUpSuggestionsSchema.parse(input);
  const result = await analyzeConversationHistory(validatedInput);
  return result;
}

// Re-add the ai import from genkit that was removed
import { ai } from '@/ai/genkit';

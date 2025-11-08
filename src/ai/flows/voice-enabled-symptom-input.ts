'use server';
/**
 * @fileOverview This file defines a Genkit flow for handling voice-enabled symptom-input.
 *
 * The flow takes voice input, converts it to text, and then generates an AI response in both text and voice in the same language.
 *
 * @fileOverview
 * - voiceEnabledSymptomInput - A function that handles voice input, converts it to text, and provides a response in text and voice.
 * - VoiceEnabledSymptomInputType - The input type for the voiceEnabledSymptomInput function.
 * - VoiceEnabledSymptomOutputType - The return type for the voiceEnabledSymptomInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const VoiceEnabledSymptomInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI of the patient speaking their symptoms. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z
    .string()
    .describe(
      'The language of the patient. Examples: Marathi, Hindi, Tamil, English'
    ),
});
export type VoiceEnabledSymptomInputType = z.infer<
  typeof VoiceEnabledSymptomInputSchema
>;

const VoiceEnabledSymptomOutputSchema = z.object({
  transcribedText: z
    .string()
    .describe('The transcribed text from the audio input.'),
  responseText: z.string().describe('The AI response in text format.'),
  responseAudioUri: z
    .string()
    .describe('The AI response in audio format as a data URI.'),
});
export type VoiceEnabledSymptomOutputType = z.infer<
  typeof VoiceEnabledSymptomOutputSchema
>;

const TextToVoiceInputSchema = z.object({
    text: z.string().describe('The text to be converted to speech.'),
    language: z.string().describe('The language of the text.'),
    });
export type TextToVoiceInputType = z.infer<typeof TextToVoiceInputSchema>;

const TextToVoiceOutputSchema = z.object({
    audioDataUri: z.string().describe('The audio data URI of the speech.'),
});
export type TextToVoiceOutputType = z.infer<typeof TextToVoiceOutputSchema>;

export async function voiceEnabledSymptomInput(
  input: VoiceEnabledSymptomInputType
): Promise<VoiceEnabledSymptomOutputType> {
  return voiceEnabledSymptomInputFlow(input);
}

export async function textToVoice(
    input: TextToVoiceInputType
): Promise<TextToVoiceOutputType> {
    const audioDataUri = await convertTextToSpeech(input.text, input.language);
    return { audioDataUri };
}

const symptomPrompt = ai.definePrompt({
  name: 'symptomPrompt',
  input: {
    schema: z.object({
      transcribedText: z
        .string()
        .describe("The transcribed text from the patient's audio input."),
      language: z.string().describe('The language of the patient.'),
    }),
  },
  output: {
    schema: z.object({
      responseText: z
        .string()
        .describe("The AI response to the patient's symptoms."),
    }),
  },
  prompt: `You are a helpful medical assistant. A patient will describe their symptoms in their local language.
Your goal is to understand their concerns and respond appropriately in the same language.

Patient's Symptoms: {{{transcribedText}}}

Language: {{{language}}}

Respond in the patient's language. Ask a clarifying question if necessary to help narrow down potential issues.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

async function convertTextToSpeech(
  text: string,
  language: string
): Promise<string> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.5-flash-preview-tts',
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName: 'Algenib'},
        },
        languageCode: language,
      },
    },
    prompt: text,
  });
  if (!media) {
    throw new Error('no media returned');
  }
  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );
  return 'data:audio/wav;base64,' + (await toWav(audioBuffer));
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const voiceEnabledSymptomInputFlow = ai.defineFlow(
  {
    name: 'voiceEnabledSymptomInputFlow',
    inputSchema: VoiceEnabledSymptomInputSchema,
    outputSchema: VoiceEnabledSymptomOutputSchema,
  },
  async input => {
    const {text: transcribedText} = await ai.generate({
      prompt: [
        {media: {url: input.audioDataUri}},
        {text: `Transcribe the audio. The language is ${input.language}.`},
      ],
    });

    const {output} = await symptomPrompt({
      transcribedText: transcribedText,
      language: input.language,
    });

    const responseAudioUri = await convertTextToSpeech(
      output!.responseText,
      input.language
    );

    return {
      transcribedText: transcribedText,
      responseText: output!.responseText,
      responseAudioUri: responseAudioUri,
    };
  }
);

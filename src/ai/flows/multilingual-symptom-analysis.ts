'use server';
/**
 * @fileOverview An AI agent that analyzes patient symptoms in multiple languages, with optional image input.
 *
 * - analyzeSymptoms - A function that analyzes patient symptoms and provides possible diagnoses.
 * - AnalyzeSymptomsInput - The input type for the analyzeSymptoms function.
 * - AnalyzeSymptomsOutput - The return type for the analyzeSymptoms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const AnalyzeSymptomsInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the patient in their local language.'),
  language: z.string().describe('The language in which the symptoms are described.'),
  chatHistory: z.string().optional().describe('Previous chat history'),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional image of the symptom, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  patientDetails: z.string().optional().describe('Patient details like name, age, phone number'),
});
export type AnalyzeSymptomsInput = z.infer<typeof AnalyzeSymptomsInputSchema>;

const AnalyzeSymptomsOutputSchema = z.object({
  diagnosis: z
    .string()
    .describe('The possible diagnoses based on the symptoms and chat history.'),
  suggestedAction: z
    .string()
    .describe('Actionable steps and suggestions for the patient.'),
  responseText: z.string().describe('The full text response for the patient.'),
  responseAudioUri: z.string().describe('The audio URI for the text-to-speech response.'),
});
export type AnalyzeSymptomsOutput = z.infer<typeof AnalyzeSymptomsOutputSchema>;

export async function analyzeSymptoms(input: AnalyzeSymptomsInput): Promise<AnalyzeSymptomsOutput> {
  return analyzeSymptomsFlow(input);
}

const diagnosisPrompt = ai.definePrompt({
  name: 'analyzeSymptomsPrompt',
  input: {schema: AnalyzeSymptomsInputSchema},
  output: {
    schema: z.object({
      diagnosis: z
        .string()
        .describe('The possible diagnoses based on the symptoms and chat history.'),
      suggestedAction: z
        .string()
        .describe('Actionable steps and suggestions for the patient.'),
    }),
  },
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are a multilingual AI medical assistant designed to help patients with initial, temporary symptom relief. Your goal is to be helpful and provide actionable advice for minor ailments, while still emphasizing that you are not a replacement for a doctor.

You will respond in the same language the patient is using.

Consider the following patient details:
{{patientDetails}}

Consider the following chat history (if any) to formulate your answer:
{{chatHistory}}

Symptoms: {{{symptoms}}}
Language: {{{language}}}
{{#if imageDataUri}}
Image: {{media url=imageDataUri}}
Analyze the provided image for visible symptoms.
{{/if}}

Based on the symptoms (and image if provided), provide a possible diagnosis and suggest a course of action. This should include suggesting specific, generic, over-the-counter medications or creams and simple home remedies suitable for temporary recovery.

Be direct, concise, and provide actionable advice. Do not say you are not a doctor or hedge your response. Do not ask follow-up questions. Provide direct suggestions for temporary relief. For example, if someone has a mild cut, suggest cleaning the wound, applying an antiseptic cream, and covering it with a bandage. For a moderate issue, you might suggest different steps.

Your response must be structured with a "Diagnosis" and a "Suggested Action".
`,
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

const analyzeSymptomsFlow = ai.defineFlow(
  {
    name: 'analyzeSymptomsFlow',
    inputSchema: AnalyzeSymptomsInputSchema,
    outputSchema: AnalyzeSymptomsOutputSchema,
  },
  async input => {
    const {output} = await diagnosisPrompt(input);
    const responseText = `${output!.diagnosis}\n\n${output!.suggestedAction}`;
    const responseAudioUri = await convertTextToSpeech(responseText, input.language);
    
    return {
      ...output!,
      responseText,
      responseAudioUri,
    };
  }
);

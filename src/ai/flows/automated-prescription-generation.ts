'use server';

/**
 * @fileOverview Automatically generates a prescription in the patient's language based on the conversation and suggested diagnosis.
 *
 * - generatePrescription - A function that handles the prescription generation process.
 * - GeneratePrescriptionInput - The input type for the generatePrescription function.
 * - GeneratePrescriptionOutput - The return type for the generatePrescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePrescriptionInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The complete conversation history between the patient and the AI.'),
  suggestedDiagnosis: z.string().describe('The AI-suggested diagnosis for the patient.'),
  patientLanguage: z.string().describe('The language of the patient.'),
});
export type GeneratePrescriptionInput = z.infer<typeof GeneratePrescriptionInputSchema>;

const GeneratePrescriptionOutputSchema = z.object({
    diagnosis: z.string().describe("The diagnosis determined from the conversation."),
    medicines: z.array(z.object({
        name: z.string().describe("The name of the medicine."),
        dosage: z.string().describe("The prescribed dosage for the medicine."),
    })).describe("A list of prescribed medicines."),
    instructions: z.string().describe("Instructions and advice for the patient."),
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;

export async function generatePrescription(
  input: GeneratePrescriptionInput
): Promise<GeneratePrescriptionOutput> {
  return generatePrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  input: {schema: GeneratePrescriptionInputSchema},
  output: {schema: GeneratePrescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in generating structured prescription data based on patient conversations and suggested diagnoses.

  Based on the following conversation history:
  {{conversationHistory}}

  And the suggested diagnosis:
  {{suggestedDiagnosis}}

  Generate a prescription in {{patientLanguage}}.

  Your output MUST be a JSON object that adheres to the output schema.

  1.  **diagnosis**: Clearly state the diagnosis.
  2.  **medicines**: Provide a list of 1-3 generic, over-the-counter medicines. For each medicine, provide a 'name' and a 'dosage' (e.g., 'Twice a day after meals').
  3.  **instructions**: Provide clear instructions and advice for the patient. Keep it concise.
  `,
});

const generatePrescriptionFlow = ai.defineFlow(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema,
    outputSchema: GeneratePrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

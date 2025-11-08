'use server';
/**
 * @fileOverview AI conversation history analysis flow.
 *
 * - analyzeConversationHistory - Analyzes the conversation history and provides suggestions.
 * - AnalyzeConversationHistoryInput - The input type for the analyzeConversationHistory function.
 * - AnalyzeConversationHistoryOutput - The return type for the analyzeConversationHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeConversationHistoryInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The complete conversation history of the patient.'),
  currentSymptoms: z.string().describe('The current symptoms reported by the patient.'),
  language: z.string().describe('The language of the conversation.'),
});
export type AnalyzeConversationHistoryInput = z.infer<
  typeof AnalyzeConversationHistoryInputSchema
>;

const AnalyzeConversationHistoryOutputSchema = z.object({
  suggestions: z.string().describe('Suggestions for relevant questions or information.'),
});
export type AnalyzeConversationHistoryOutput = z.infer<
  typeof AnalyzeConversationHistoryOutputSchema
>;

export async function analyzeConversationHistory(
  input: AnalyzeConversationHistoryInput
): Promise<AnalyzeConversationHistoryOutput> {
  return analyzeConversationHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeConversationHistoryPrompt',
  input: {schema: AnalyzeConversationHistoryInputSchema},
  output: {schema: AnalyzeConversationHistoryOutputSchema},
  prompt: `You are an AI assistant analyzing patient conversation history to provide relevant suggestions.

  Based on the following conversation history:
  {{conversationHistory}}

  And the patient's current symptoms:
  {{currentSymptoms}}

  In the language: {{language}}

  Suggest relevant questions or information that could help in understanding the patient's condition and enhance their healthcare experience.
  The suggestions should be concise and easy to understand for the patient.
  Be specific, and only refer to the patient's history.  Do not suggest that the patient seek medical advice, or provide medical advice yourself.
  Focus on gathering more information to assist a future practitioner.
  Limit suggestions to 2 sentences maximum.
  `,
});

const analyzeConversationHistoryFlow = ai.defineFlow(
  {
    name: 'analyzeConversationHistoryFlow',
    inputSchema: AnalyzeConversationHistoryInputSchema,
    outputSchema: AnalyzeConversationHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

import {genkit, GenkitErrorCode} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

function getGoogleAIPlugin() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'Missing GEMINI_API_KEY environment variable. See https://firebase.google.com/docs/app-hosting/configure#set-secrets to set it.'
      );
    }
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }
  return googleAI({
    apiKey: geminiApiKey,
  });
}

export const ai = genkit({
  plugins: [getGoogleAIPlugin()],
  model: 'googleai/gemini-2.5-flash',

});

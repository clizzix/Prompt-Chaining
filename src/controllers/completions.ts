import type { RequestHandler } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import type { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod'; // new import
import type { ChatCompletionMessageParam } from 'openai/resources'; // new import
import { type PromptBodySchema, intentSchema } from '#schemas'; // import intentSchema

type IncomingPrompt = z.infer<typeof PromptBodySchema>;
type ResponseCompletion = { completion: string };

export const createCompletion: RequestHandler<unknown, ResponseCompletion, IncomingPrompt> = async (
  req,
  res
) => {
  const { prompt } = req.body;
  // Gemini client setup
  const client = new GoogleGenAI({
    apiKey:
      process.env.NODE_ENV === 'development'
        ? process.env.LOCAL_LLM_KEY
        : process.env.GEMINI_API_KEY
  });
  // Model, we define it here so we can use it in both steps
  const model =
    process.env.NODE_ENV === 'development'
      ? process.env.LOCAL_LLM_MODEL!
      : process.env.GEMINI_MODEL!;
  // Messages, we define it here so we can add more in the future
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You determine if a question is about Pokémon. You can only answer questions about a single Pokémon and not open-ended questions.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  // Step 1: Check if the prompt is about Pokémon
  const checkIntentCompletion = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        'You determine if a question is about Pokémon. You can You can only answer questions about a single Pokémon and not open-ended questions.',
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isPokemon: { type: Type.BOOLEAN },
          type: { type: Type.STRING },
          pokemonName: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ['isPokemon', 'type', 'pokemonName', 'reason'],
        propertyOrdering: ['isPokemon', 'type', 'pokemonName', 'reason']
      }
    }
  });

  const intent = intentSchema.parse(JSON.parse(checkIntentCompletion.text ?? '{}'));
  if (!intent?.isPokemon) {
    res.status(400).json({
      completion: intent?.reason || 'I cannot answer this question, try asking about a Pokémon.'
    });
    return;
  }
  console.log(`\x1b[34mIntent detected. Received a question about: ${intent.pokemonName}\x1b[0m`);
  messages.push({
    role: 'assistant',
    content: JSON.stringify(intent, null, 2)
  });
  // Step 2 goes here
  res.json({
    completion: 'To be implemented: '
  });
};

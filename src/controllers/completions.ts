import type { RequestHandler } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import type { z } from 'zod';
import type { ChatCompletionMessageParam } from 'openai/resources'; // new import
import { type PromptBodySchema, intentSchema, finalResponseSchema } from '#schemas'; // import intentSchema
import Pokedex from 'pokedex-promise-v2';

type IncomingPrompt = z.infer<typeof PromptBodySchema>;
type FinalResponse = z.infer<typeof finalResponseSchema>;
type ResponseCompletion = { completion: string } | FinalResponse;

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
    model,
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
  const P = new Pokedex();
  const pokemonData = await P.getPokemonByName(intent.pokemonName.toLowerCase());
  if (!pokemonData) {
    res.status(404).json({
      completion: `Pokémon ${intent.pokemonName} not found.`
    });
    return;
  }

  console.log(`\x1b[32mFetched data for Pokémon: ${pokemonData.name}\x1b[0m`);

  messages.push({
    role: 'assistant',
    content: `This is all relevant data about the Pokémon: ${intent.pokemonName}: ${JSON.stringify(pokemonData, null, 2)} Combine it with what you know about it to give the user complete answer.`
  });
  console.log(`\x1b[33mAdded Pokémon data to messages for further processing.\x1b[0m`);

  const finalCompletion = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        'You checked if it is a Pokémon and are now providing the data to the user.',
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.NUMBER },
          name: { type: Type.STRING },
          aboutSpecies: { type: Type.STRING },
          types: { type: Type.ARRAY, items: { type: Type.STRING } },
          abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
          abilitiesExplained: { type: Type.STRING },
          frontSpriteURL: { type: Type.STRING }
        },
        required: [
          'id',
          'name',
          'aboutSpecies',
          'types',
          'abilities',
          'abilitiesExplained',
          'frontSpriteURL'
        ],
        propertyOrdering: [
          'id',
          'name',
          'aboutSpecies',
          'types',
          'abilities',
          'abilitiesExplained',
          'frontSpriteURL'
        ]
      }
    }
  });

  const finalResponse = finalResponseSchema.parse(JSON.parse(finalCompletion.text ?? '{}'));
  if (!finalResponse) {
    res.status(500).json({ completion: 'Failed to generate a final response.' });
    return;
  }
  res.json(finalResponse);
};

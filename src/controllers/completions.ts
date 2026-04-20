import type { RequestHandler } from 'express';
import { GoogleGenAI, Type, FunctionCallingConfigMode, type Tool } from '@google/genai';
import type { z } from 'zod';
import { type promptBodySchema, type finalResponseSchema } from '#schemas';
import { getPokemon, returnError } from '#utils';

type IncomingPrompt = z.infer<typeof promptBodySchema>;
type FinalResponse = z.infer<typeof finalResponseSchema>;
type ResponseCompletion = { completion: string } | FinalResponse;
type FunctionArgs = { pokemonName?: string; message?: string };

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_pokemon',
        description: 'Get details for a single Pokémon by name',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pokemonName: {
              type: Type.STRING,
              description: 'The name of the Pokémon to get details for'
            }
          },
          required: ['pokemonName']
        }
      },
      {
        name: 'return_error',
        description: 'Return an error when the user asks something that is NOT about Pokémon.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: 'The reason why the question is not about Pokémon'
            }
          },
          required: ['message']
        }
      }
    ]
  }
];

export const handleCompletion: RequestHandler = async (req, res) => {
  const { prompt } = req.body as IncomingPrompt;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const result = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction:
        'You determine if a question is about Pokémon. If the user asks about a Pokémon, call get_pokemon. Otherwise, call return_error.',
      tools,
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.ANY }
      }
    }
  });

  const responseContent = result.candidates?.[0]?.content;
  const parts = responseContent?.parts ?? [];
  const functionCalls = parts.filter(p => p.functionCall);

  if (!responseContent || functionCalls.length === 0) {
    res.status(500).json({ error: 'No Tool Call generated.' });
    return;
  }

  const history = [{ role: 'user', parts: [{ text: prompt }] }, responseContent];

  for (const part of functionCalls) {
    const { name, args } = part.functionCall!;
    const callArgs = (args ?? {}) as FunctionArgs;
    let toolData;

    if (name === 'get_pokemon') {
      toolData = await getPokemon({ pokemonName: callArgs.pokemonName ?? '' });
    } else {
      toolData = await returnError({ message: callArgs.message ?? '' });
    }

    history.push({
      role: 'tool',
      parts: [
        {
          functionResponse: {
            name,
            response: { content: toolData }
          }
        }
      ]
    });
  }

  const finalResult = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents: history,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = finalResult.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    res.status(500).json({ error: 'No final response generated.' });
    return;
  }

  const finalResponse: ResponseCompletion = JSON.parse(text);
  res.json(finalResponse);
};

import Pokedex, { type Pokemon } from 'pokedex-promise-v2';
import type { ErrorResponseDTO } from '#types';

export const getPokemon = async ({ pokemonName }: { pokemonName: string }): Promise<Pokemon> => {
  console.log(`\x1b[35mFunction get_pokemon called with: ${pokemonName}\x1b[0m`);
  const P = new Pokedex();
  return await P.getPokemonByName(pokemonName.toLowerCase());
};

export const returnError = async ({ message }: { message: string }): Promise<ErrorResponseDTO> => {
  console.error(`\x1b[31mError: ${message}\x1b[0m`);
  return {
    success: false,
    error: message
  };
};

// export const createOpenAICompletion = async (
//   client: OpenAI,
//   res: Response,
//   llmRequest: ChatCompletionCreateParamsNonStreaming,
//   stream: boolean
// ) => {
//   if (stream) {
//     const completion = await client.chat.completions.create({
//       ...llmRequest,
//       stream
//     });
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');

//     for await (const part of completion) {
//       if (part.choices[0]?.delta?.content) {
//         res.write(`data: ${part.choices[0].delta.content}\n\n`);
//       }
//     }
//     res.end();
//     return;
//   } else {
//     const completion = await client.chat.completions.create(llmRequest);
//     res
//       .status(200)
//       .json({ completion: completion.choices[0]?.message.content || 'No completion generated' });
//   }
// };

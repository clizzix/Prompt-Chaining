import type { z } from 'zod';
import type { finalResponseSchema, promptBodySchema } from '#schemas';

export type IncomingPrompt = z.infer<typeof promptBodySchema>;

export type ErrorResponseDTO = {
  success: false;
  error: string;
};
export type FinalResponseDTO =
  | z.infer<typeof finalResponseSchema>
  | ErrorResponseDTO
  | { completion: string };

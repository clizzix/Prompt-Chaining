import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

const validateBodyZod =
  <T>(zodSchema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = zodSchema.safeParse(req.body);
    if (!result.success) {
      const errorMessage = result.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      next(
        new Error(`Validation failed: ${errorMessage}`, {
          cause: {
            status: 400
          }
        })
      );
    } else {
      req.body = result.data;
      next();
    }
  };

export default validateBodyZod;

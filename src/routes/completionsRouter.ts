import { Router } from 'express';
import { createCompletion } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { PromptBodySchema } from '#schemas';

const completionsRouter = Router();
completionsRouter.use(validateBodyZod(PromptBodySchema));

completionsRouter.post('/chained-prompt', createCompletion);

export default completionsRouter;

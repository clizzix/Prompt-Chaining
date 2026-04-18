import { Router } from 'express';
import { sendPrompt } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { PromptBodySchema } from '#schemas';

const gemmaRouter = Router();

gemmaRouter.use(validateBodyZod(PromptBodySchema));

gemmaRouter.post('/gemma-prompt', sendPrompt);

export default gemmaRouter;

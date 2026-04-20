import { Router } from 'express';
import { sendPrompt } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { promptBodySchema } from '#schemas';

const gemmaRouter = Router();

gemmaRouter.use(validateBodyZod(promptBodySchema));

gemmaRouter.post('/gemma-prompt', sendPrompt);

export default gemmaRouter;

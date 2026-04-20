import { Router } from 'express';
import { handleCompletion } from '#controllers';
import { validateBodyZod } from '#middlewares';
import { promptBodySchema } from '#schemas';

const completionsRouter = Router();
completionsRouter.use(validateBodyZod(promptBodySchema));

completionsRouter.post('/chained-prompt', handleCompletion);

export default completionsRouter;

import express from 'express';
import { completionsRouter } from '#routes';
import { errorHandler, notFoundHandler } from '#middlewares';

const app = express();
const port = process.env.PORT || '3000';

app.use(express.json());
app.use('/ai', completionsRouter);
app.use('*splat', notFoundHandler);
app.use(errorHandler);

app.listen(port, () =>
  console.log(`\x1b[35mExample app listening at http://localhost:${port}\x1b[0m`)
);

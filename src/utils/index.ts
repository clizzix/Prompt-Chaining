import type { Response } from 'express';
import type { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import OpenAI from 'openai';

export const createOpenAICompletion = async (
  client: OpenAI,
  res: Response,
  llmRequest: ChatCompletionCreateParamsNonStreaming,
  stream: boolean
) => {
  if (stream) {
    const completion = await client.chat.completions.create({
      ...llmRequest,
      stream
    });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const part of completion) {
      if (part.choices[0]?.delta?.content) {
        res.write(`data: ${part.choices[0].delta.content}\n\n`);
      }
    }
    res.end();
    return;
  } else {
    const completion = await client.chat.completions.create(llmRequest);
    res
      .status(200)
      .json({ completion: completion.choices[0]?.message.content || 'No completion generated' });
  }
};

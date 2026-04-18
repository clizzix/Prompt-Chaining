import type { PromptBodySchema } from '#schemas';
import type { RequestHandler } from 'express';
import { z } from 'zod';

const ollamaURL = 'http://127.0.0.1:11434/v1/chat/completions';
const model = process.env.LOCAL_LLM_MODEL;

type IncomingPrompt = z.infer<typeof PromptBodySchema>;

export const sendPrompt: RequestHandler<unknown, unknown, IncomingPrompt> = async (
  req,
  res,
  next
) => {
  try {
    const { prompt, stream } = req.body as { prompt?: string; stream?: boolean };
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    const response = await fetch(ollamaURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: stream ?? false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: text });
      return;
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        res.write('data: {"error": "No response body"\n\n');
        res.end();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content ?? '';
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch {}
            }
          }
        }
        res.end();
      } catch (error) {
        next(error);
      }
    } else {
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      res.json({
        originalPrompt: prompt,
        generatedResponse: data.choices?.[0]?.message?.content ?? ''
      });
    }
  } catch (error) {
    next(error);
  }
};

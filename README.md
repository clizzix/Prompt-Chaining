**_ AI PROMPT CHAINING _**
Setup: Ollama and Gemini-SDK
test:

```bash
# to launch a local server running with gemma 4

ollama run gemma4:e4b

# npm run dev in your project file

npm run dev

# Test the controllers

# gemma4 for general questions
curl -X POST http://localhost:3000/ai/gemma/gemma-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Why is the sky blue?"}'

# gemini_sdk with prompt-chaining configured for Pokemon related questions
curl -s -X POST http://localhost:3000/ai/gemini/chained-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What type is Charizard?"}'

curl -X POST http://localhost:3000/ai/gemini/chained-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me about Pikachu"}'
```

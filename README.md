# AI Chatbot

A sleek Flask-based AI chatbot that proxies messages to any OpenAI-compatible LLM provider.

## Quick start

```bash
# 1. Create a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure your LLM provider
#    Edit .env and set your real API key and URL

# 4. Run the app
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Configuration

Edit the `.env` file:

| Variable      | Description                          | Example                                       |
|---------------|--------------------------------------|-----------------------------------------------|
| `LLM_API_KEY` | Your LLM provider API key           | `sk-abc123...`                                |
| `LLM_API_URL` | LLM chat completions endpoint       | `https://api.openai.com/v1/chat/completions`  |
| `LLM_MODEL`   | Model name (defaults to gpt-3.5-turbo) | `gpt-4`, `llama3-70b-8192`                 |

Works with **OpenAI**, **Groq**, **Together AI**, **Anyscale**, and any OpenAI-compatible provider.

## Project structure

```
ai-chatbot/
├─ app.py              # Flask server
├─ templates/
│  └─ index.html       # Chat UI
├─ static/
│  └─ app.js           # Frontend logic
├─ .env                # Secrets (never commit)
├─ .gitignore
├─ requirements.txt
└─ README.md
```

## Security

- API key is **server-side only** — never exposed to the browser.
- Input length is capped at 4 000 characters.
- All user text is HTML-escaped before rendering.

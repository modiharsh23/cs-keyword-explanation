# CS Keyword Explainer ✦

**Live Demo:** [https://cs-keyword-explanation.onrender.com](https://cs-keyword-explanation.onrender.com)

A sleek, dark-themed web application that explains any **computer science topic** in a structured format — powered by **Google Gemini AI**.

Type a keyword like *"Virtualization"*, *"Docker"*, or *"TCP/IP"* and instantly get:
- A **concise explanation** of the topic
- **Key concepts** you must know
- **Best written resources** with links
- **Recommended video links** (YouTube search)
- **Suggested tutorials & courses**

## Screenshot

> The app features a modern dark UI with a centered search box, two-column result layout (explanation + resources), and a collapsible search history sidebar.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/modiharsh23/cs-keyword-explanation.git
cd cs-keyword-explanation

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Add your Gemini API key
#    Edit .env and set GEMINI_API_KEY
#    Get a key at https://aistudio.google.com/apikey

# 5. Run the app
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

## Configuration

Edit the `.env` file:

| Variable         | Description                        | Default              |
|------------------|------------------------------------|----------------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | —               |
| `GEMINI_MODEL`   | Gemini model to use                | `gemini-2.0-flash`   |

Get your free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## Tech Stack

- **Backend:** Flask + Google Gemini API (`google-genai` SDK)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Markdown Rendering:** [marked.js](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **Storage:** Browser `localStorage` for search history

## Features

- 🔍 **Instant topic search** — type any CS keyword and get a structured explanation
- 📚 **Resource sidebar** — written resources, videos, and tutorials in a right panel
- 🕒 **Search history** — past searches saved locally, click to revisit, swipe to delete
- 🎨 **Dark theme** — modern glassmorphism UI with gradient accents
- 📱 **Responsive** — works on desktop and mobile
- 🔒 **Secure** — API key stays server-side, markdown sanitized with DOMPurify

## Project Structure

```
cs-keyword-explanation/
├─ app.py              # Flask server + Gemini API proxy
├─ templates/
│  └─ index.html       # UI (search, loading, result views)
├─ static/
│  └─ app.js           # Frontend logic (search, history, rendering)
├─ .env                # API key (never committed)
├─ .gitignore
├─ requirements.txt
└─ README.md
```

## Security

- API key is **server-side only** — never exposed to the browser
- Input length is capped at 4,000 characters
- Markdown output is sanitized with DOMPurify to prevent XSS

## License

MIT

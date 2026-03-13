import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)

# ── Configuration ──────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    print("⚠️  WARNING: GEMINI_API_KEY is not set. The /chat endpoint will not work.")
    print("   Get your key at https://aistudio.google.com/apikey")
    print("   Then paste it into the .env file.")

# Create the Genai client
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# ── Routes ─────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the chat UI."""
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    """Proxy a user message to Google Gemini and return the reply."""
    # --- Validate configuration ---
    if not client or not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        return jsonify({"error": "Server is not configured. Set GEMINI_API_KEY in .env"}), 503

    # --- Validate input ---
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Message is required."}), 400

    if len(user_message) > 4000:
        return jsonify({"error": "Message too long (max 4 000 characters)."}), 400

    # --- Call Gemini ---
    try:
        system_prompt = (
            "You are a computer science tutor. When the user types a topic, "
            "respond using STRICT markdown with the EXACT structure below. "
            "Use ## for section headings, - for bullet points, 1. for numbered lists, "
            "**bold** for emphasis, and [text](url) for links.\n\n"
            "TEMPLATE:\n\n"
            "## [Topic Name] — Short Explanation\n\n"
            "[One clear paragraph explaining the topic.]\n\n"
            "---\n\n"
            "## Key Concepts You Must Know\n\n"
            "- **Concept 1:** Brief description.\n"
            "- **Concept 2:** Brief description.\n"
            "- **Concept 3:** Brief description.\n\n"
            "---\n\n"
            "## Best Written Resources\n\n"
            "1. [Title](https://url) — Brief description of the resource.\n"
            "2. [Title](https://url) — Brief description of the resource.\n\n"
            "---\n\n"
            "## Recommended Video Links\n\n"
            "For videos, ALWAYS use YouTube search URLs in this format:\n"
            "- [Descriptive search title](https://www.youtube.com/results?search_query=TOPIC+keyword+keyword)\n\n"
            "Example:\n"
            "- [Virtualization Explained - Beginner Guide](https://www.youtube.com/results?search_query=virtualization+explained+beginner+guide)\n"
            "- [Type 1 vs Type 2 Hypervisors](https://www.youtube.com/results?search_query=type+1+vs+type+2+hypervisor+explained)\n\n"
            "---\n\n"
            "## Suggested Structured Tutorials\n\n"
            "- [Course/Playlist Name](https://url) — Brief description.\n"
            "- [Course/Playlist Name](https://url) — Brief description.\n\n"
            "---\n\n"
            "*You might also want to ask about: **Related Topic 1**, **Related Topic 2**, or **Related Topic 3**.*\n\n"
            "RULES:\n"
            "- ALWAYS use ## for section headers, never just bold text.\n"
            "- ALWAYS use --- between sections for visual separation.\n"
            "- ALWAYS format links as [text](url), never bare URLs.\n"
            "- For written resources: use ONLY well-known official URLs you are confident exist "
            "(e.g. ibm.com, aws.amazon.com, geeksforgeeks.org, mozilla.org, wikipedia.org).\n"
            "- For video links: NEVER use specific youtube.com/watch?v= URLs. "
            "ALWAYS use youtube.com/results?search_query= search URLs instead. "
            "Replace spaces with + in the query.\n"
            "- For tutorials: use official course platform URLs (coursera.org, freecodecamp.org, etc.).\n"
            "- NEVER invent or guess a URL. If unsure, use a YouTube search URL.\n"
            "- Keep explanations concise but thorough."
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=user_message,
            config={
                "system_instruction": system_prompt,
                "temperature": 0.7,
            },
        )
        assistant_text = response.text

        return jsonify({"reply": assistant_text})

    except Exception as exc:
        error_msg = str(exc)
        print(f"Gemini API error: {error_msg}")

        # Give a user-friendly message for quota errors
        if "429" in error_msg or "quota" in error_msg.lower():
            return jsonify({
                "error": "Gemini API rate limit exceeded. Your free-tier daily quota may be exhausted. "
                         "Wait for it to reset (midnight PT) or enable billing in Google Cloud."
            }), 429

        return jsonify({"error": f"Gemini API request failed: {error_msg}"}), 502


# ── Entry point ────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)

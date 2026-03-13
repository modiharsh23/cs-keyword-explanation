// ── DOM references ──────────────────────────────────────────
const searchView = document.getElementById("search-view");
const loadingView = document.getElementById("loading-view");
const resultView = document.getElementById("result-view");
const topicInput = document.getElementById("topic-input");
const searchBtn = document.getElementById("search-btn");
const mainContent = document.getElementById("main-content");
const sidebarContent = document.getElementById("sidebar-content");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const historySidebar = document.getElementById("history-sidebar");

// ── Configure marked ────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true });

// ── LocalStorage key ────────────────────────────────────────
const STORAGE_KEY = "cs_explorer_history";

// ── Sidebar keywords for splitting content ──────────────────
const SIDEBAR_KEYWORDS = [
    "written resource", "best resource", "resources",
    "video link", "recommended video", "video",
    "tutorial", "structured tutorial", "suggested",
    "course", "playlist",
];
const MAIN_KEYWORDS = [
    "explanation", "short explanation",
    "key concept", "concepts you must know",
];

// ══════════════════════════════════════════════════════════════
//  HISTORY MANAGEMENT
// ══════════════════════════════════════════════════════════════

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addToHistory(topic, reply) {
    const history = getHistory();
    // Remove duplicate if exists
    const filtered = history.filter(h => h.topic.toLowerCase() !== topic.toLowerCase());
    // Add to front
    filtered.unshift({
        topic: topic,
        reply: reply,
        timestamp: Date.now(),
    });
    // Keep max 50 entries
    if (filtered.length > 50) filtered.pop();
    saveHistory(filtered);
    renderHistory();
}

function deleteFromHistory(topic) {
    const history = getHistory();
    const filtered = history.filter(h => h.topic.toLowerCase() !== topic.toLowerCase());
    saveHistory(filtered);
    renderHistory();
}

function clearAllHistory() {
    if (!confirm("Clear all search history?")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
    newSearch();
}

function renderHistory() {
    const history = getHistory();

    // Clear existing items (keep empty message)
    historyList.querySelectorAll(".history-item").forEach(el => el.remove());

    if (history.length === 0) {
        historyEmpty.style.display = "block";
        return;
    }

    historyEmpty.style.display = "none";

    for (const entry of history) {
        const item = document.createElement("div");
        item.className = "history-item";
        item.setAttribute("data-topic", entry.topic);

        const timeAgo = getTimeAgo(entry.timestamp);

        item.innerHTML = `
      <div class="history-item-icon">📚</div>
      <div class="history-item-text">
        <div class="topic-name">${escapeHtml(entry.topic)}</div>
        <div class="topic-time">${timeAgo}</div>
      </div>
      <button class="history-delete" title="Delete" onclick="event.stopPropagation(); deleteFromHistory('${escapeAttr(entry.topic)}')">✕</button>
    `;

        item.addEventListener("click", () => loadFromHistory(entry.topic));
        historyList.appendChild(item);
    }
}

function loadFromHistory(topic) {
    const history = getHistory();
    const entry = history.find(h => h.topic.toLowerCase() === topic.toLowerCase());
    if (!entry) return;

    displayResult(entry.reply);
    highlightHistoryItem(topic);

    // Close sidebar
    historySidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");
}

function highlightHistoryItem(topic) {
    historyList.querySelectorAll(".history-item").forEach(el => {
        el.classList.toggle("active",
            el.getAttribute("data-topic").toLowerCase() === topic.toLowerCase()
        );
    });
}

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ── Sidebar toggle ──────────────────────────────────────────
const sidebarBackdrop = document.getElementById("sidebar-backdrop");

function toggleHistorySidebar() {
    const isOpen = historySidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("show", isOpen);
}

// ══════════════════════════════════════════════════════════════
//  VIEW SWITCHING
// ══════════════════════════════════════════════════════════════

function showView(view) {
    searchView.style.display = "none";
    loadingView.style.display = "none";
    resultView.style.display = "none";

    if (view === "search") searchView.style.display = "flex";
    if (view === "loading") loadingView.style.display = "flex";
    if (view === "result") resultView.style.display = "flex";
}

// ══════════════════════════════════════════════════════════════
//  CONTENT SPLITTING & RENDERING
// ══════════════════════════════════════════════════════════════

function splitContent(markdownText) {
    const lines = markdownText.split("\n");
    const sections = [];
    let currentSection = { heading: "", lines: [] };

    for (const line of lines) {
        if (/^##\s+/.test(line)) {
            if (currentSection.heading || currentSection.lines.length > 0) {
                sections.push({ ...currentSection });
            }
            currentSection = { heading: line, lines: [] };
        } else {
            currentSection.lines.push(line);
        }
    }
    if (currentSection.heading || currentSection.lines.length > 0) {
        sections.push(currentSection);
    }

    const mainSections = [];
    const sidebarSections = [];

    for (const section of sections) {
        const headingLower = section.heading.toLowerCase();
        const isSidebar = SIDEBAR_KEYWORDS.some(kw => headingLower.includes(kw));
        const isMain = MAIN_KEYWORDS.some(kw => headingLower.includes(kw));

        if (isSidebar && !isMain) {
            sidebarSections.push(section);
        } else {
            mainSections.push(section);
        }
    }

    const mainMarkdown = mainSections
        .map(s => s.heading + "\n" + s.lines.join("\n"))
        .join("\n");

    return { mainMarkdown, sidebarSections };
}

function buildSidebar(sections) {
    if (sections.length === 0) return "";
    let html = "";

    for (const section of sections) {
        const title = section.heading.replace(/^##\s+/, "").trim();
        const body = section.lines.join("\n").trim();
        const links = extractLinks(body);

        html += `<div class="sidebar-section">`;
        html += `<div class="sidebar-section-title">${escapeHtml(title)}</div>`;

        if (links.length > 0) {
            for (const link of links) {
                html += `<a class="resource-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">`;
                html += `<div class="link-title">${escapeHtml(link.title)}</div>`;
                if (link.description) {
                    html += `<div class="link-desc">${escapeHtml(link.description)}</div>`;
                }
                html += `<div class="link-url">${escapeHtml(shortenUrl(link.url))}</div>`;
                html += `</a>`;
            }
        } else {
            const rawHtml = marked.parse(body);
            html += `<div class="md-content">${DOMPurify.sanitize(rawHtml)}</div>`;
        }

        html += `</div>`;
    }
    return html;
}

function extractLinks(text) {
    const links = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)(?:\s*[—–\-]\s*(.+))?/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        links.push({
            title: match[1].trim(),
            url: match[2].trim(),
            description: match[3] ? match[3].trim() : "",
        });
    }
    if (links.length === 0) {
        const lines = text.split("\n");
        for (const line of lines) {
            const lineMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(line);
            if (lineMatch) {
                const rest = line.replace(lineMatch[0], "").replace(/^[\s\d.*\-]+/, "").replace(/[—–\-]\s*/, "").trim();
                links.push({
                    title: lineMatch[1].trim(),
                    url: lineMatch[2].trim(),
                    description: rest,
                });
            }
        }
    }
    return links;
}

function shortenUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname + (u.pathname.length > 1 ? u.pathname.substring(0, 30) + "..." : "");
    } catch {
        return url.substring(0, 40) + "...";
    }
}

// ── Display a result (from search or history) ───────────────
function displayResult(reply) {
    const { mainMarkdown, sidebarSections } = splitContent(reply);

    const rawHtml = marked.parse(mainMarkdown);
    mainContent.innerHTML = DOMPurify.sanitize(rawHtml);
    sidebarContent.innerHTML = buildSidebar(sidebarSections);

    // Make all links open in new tab
    document.querySelectorAll(".md-content a").forEach(a => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
    });

    showView("result");
}

// ══════════════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════════════

async function doSearch(topic) {
    topic = topic.trim();
    if (!topic) return;

    showView("loading");

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: topic }),
        });

        const data = await res.json();

        if (data.reply) {
            // Save to history
            addToHistory(topic, data.reply);
            highlightHistoryItem(topic);

            // Display
            displayResult(data.reply);
        } else {
            mainContent.innerHTML = `<div class="error-msg">${escapeHtml(data.error || "Unknown error")}</div>`;
            sidebarContent.innerHTML = "";
            showView("result");
        }
    } catch (err) {
        mainContent.innerHTML = `<div class="error-msg">Failed to connect to the server. Make sure the Flask app is running.</div>`;
        sidebarContent.innerHTML = "";
        showView("result");
    }
}

function newSearch() {
    topicInput.value = "";
    mainContent.innerHTML = "";
    sidebarContent.innerHTML = "";
    showView("search");
    topicInput.focus();
    // Remove active highlight
    historyList.querySelectorAll(".history-item").forEach(el => el.classList.remove("active"));
}

function quickSearch(el) {
    doSearch(el.textContent);
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════

function escapeHtml(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ── Event listeners ─────────────────────────────────────────
searchBtn.addEventListener("click", () => doSearch(topicInput.value));

topicInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        doSearch(topicInput.value);
    }
});

// ── Initialize history on page load ─────────────────────────
renderHistory();

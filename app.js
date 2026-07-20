"use strict";

const http = require("node:http");

const { createMemoryCounterStore } = require("./counter-store");

const dashboardHtml = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Dashboard theo dõi số request HTTP vào ứng dụng.">
  <meta name="theme-color" content="#07111f">
  <title>Request Counter</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --panel: rgba(14, 27, 45, 0.78);
      --line: rgba(148, 163, 184, 0.18);
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --accent-strong: #0ea5e9;
      --success: #34d399;
    }

    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      overflow-x: hidden;
      color: var(--text);
      background:
        radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.2), transparent 34rem),
        radial-gradient(circle at 82% 74%, rgba(52, 211, 153, 0.12), transparent 30rem),
        var(--bg);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(760px, calc(100% - 32px));
      padding: 42px;
      border: 1px solid var(--line);
      border-radius: 28px;
      background: var(--panel);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(18px);
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 30px;
      color: var(--success);
      font-size: 0.78rem;
      font-weight: 750;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .status::before {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 18px currentColor;
      content: "";
    }

    h1 {
      margin: 0;
      font-size: clamp(2.2rem, 7vw, 4.6rem);
      line-height: 0.98;
      letter-spacing: -0.055em;
    }

    .intro {
      max-width: 570px;
      margin: 20px 0 0;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.7;
    }

    .counter {
      margin: 44px 0 34px;
      padding: 30px;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: rgba(2, 6, 23, 0.38);
    }

    .counter-label {
      display: block;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    #count {
      display: block;
      margin-top: 10px;
      color: var(--accent);
      font-size: clamp(4rem, 16vw, 8rem);
      font-variant-numeric: tabular-nums;
      font-weight: 800;
      line-height: 0.95;
      letter-spacing: -0.07em;
    }

    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 24px;
      color: var(--muted);
      font-size: 0.84rem;
    }

    .meta span { overflow-wrap: anywhere; }
    .meta strong { color: var(--text); font-weight: 650; }

    button {
      width: 100%;
      min-height: 54px;
      border: 0;
      border-radius: 16px;
      color: #03111b;
      background: linear-gradient(135deg, var(--accent), var(--accent-strong));
      box-shadow: 0 16px 34px rgba(14, 165, 233, 0.22);
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      transition: transform 160ms ease, filter 160ms ease;
    }

    button:hover { filter: brightness(1.08); transform: translateY(-2px); }
    button:active { transform: translateY(0); }
    button:disabled { cursor: wait; filter: saturate(0.5); }
    button:focus-visible { outline: 3px solid rgba(56, 189, 248, 0.42); outline-offset: 4px; }

    .note {
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 0.78rem;
      line-height: 1.5;
      text-align: center;
    }

    @media (max-width: 560px) {
      main { padding: 28px 22px; border-radius: 22px; }
      .meta { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <div class="status">Ứng dụng đang hoạt động</div>
    <h1>Request<br>Counter</h1>
    <p class="intro">Theo dõi lượng HTTP request thực đi vào ứng dụng. Healthcheck và request đọc số liệu không được tính để kết quả không tự tăng.</p>

    <section class="counter" aria-live="polite">
      <span class="counter-label">Tổng request</span>
      <strong id="count">—</strong>
      <div class="meta">
        <span>Khởi động: <strong id="started-at">—</strong></span>
        <span>Request cuối: <strong id="last-request">—</strong></span>
      </div>
    </section>

    <button id="send-request" type="button">Gửi một request thử</button>
    <p class="note">Số liệu được lưu trên volume bền vững và vẫn được giữ nguyên khi restart hoặc redeploy.</p>
  </main>

  <script>
    const countElement = document.querySelector("#count");
    const startedAtElement = document.querySelector("#started-at");
    const lastRequestElement = document.querySelector("#last-request");
    const button = document.querySelector("#send-request");

    const formatTime = (value) => value
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value))
      : "Chưa có";

    async function refresh() {
      const response = await fetch("/api/count", { cache: "no-store" });
      if (!response.ok) throw new Error("Không đọc được số liệu");
      const data = await response.json();
      countElement.textContent = new Intl.NumberFormat("vi-VN").format(data.count);
      startedAtElement.textContent = formatTime(data.startedAt);
      lastRequestElement.textContent = formatTime(data.lastRequestAt);
    }

    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const response = await fetch("/api/request", { method: "POST" });
        if (!response.ok) throw new Error("Request thất bại");
        await refresh();
      } finally {
        button.disabled = false;
      }
    });

    refresh().catch(() => { countElement.textContent = "Lỗi"; });
    setInterval(() => refresh().catch(() => {}), 5000);
  </script>
</body>
</html>`;

const passivePaths = new Set(["/health", "/api/count", "/favicon.ico"]);

function sendJson(response, statusCode, data, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
  response.end(JSON.stringify(data));
}

function createRequestCounterServer(options = {}) {
  const startedAt = options.startedAt || new Date();
  const counter = options.counter || createMemoryCounterStore();

  return http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://localhost");
    const isCounted = !passivePaths.has(url.pathname);
    const snapshot = isCounted ? counter.increment() : counter.getSnapshot();

    const commonHeaders = {
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Request-Count": String(snapshot.count),
    };

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { status: "ok" }, commonHeaders);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/count") {
      sendJson(response, 200, {
        count: snapshot.count,
        startedAt: startedAt.toISOString(),
        lastRequestAt: snapshot.lastRequestAt,
        persistent: Boolean(counter.filePath),
      }, commonHeaders);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/request") {
      sendJson(response, 200, { count: snapshot.count }, commonHeaders);
      return;
    }

    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        ...commonHeaders,
      });
      response.end(dashboardHtml);
      return;
    }

    if (url.pathname === "/favicon.ico") {
      response.writeHead(204, commonHeaders);
      response.end();
      return;
    }

    sendJson(response, 404, { error: "Not found" }, commonHeaders);
  });
}

module.exports = { createRequestCounterServer };

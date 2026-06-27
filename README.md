# 🕵️‍♂️ Autonomous Competitor Intelligence Engine

<div align="center">

<!-- Animated SVG Banner Widget -->
<svg width="100%" height="160" viewBox="0 0 800 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 800px; border-radius: 12px; border: 1px solid #1E293B; background: #0B0F19; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
  <style>
    @keyframes pulse {
      0% { r: 5px; opacity: 1; }
      50% { r: 25px; opacity: 0.3; }
      100% { r: 45px; opacity: 0; }
    }
    @keyframes sweep {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes dash {
      to { stroke-dashoffset: -20; }
    }
    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    @keyframes pulseNode {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px #38BDF8); }
      50% { transform: scale(1.05); filter: drop-shadow(0 0 8px #38BDF8); }
    }
    .radar-circle {
      transform-origin: 100px 80px;
      animation: pulse 3s infinite linear;
    }
    .radar-sweep {
      transform-origin: 100px 80px;
      animation: sweep 5s infinite linear;
    }
    .flow-line {
      stroke-dasharray: 6 3;
      animation: dash 1.5s infinite linear;
    }
    .status-dot {
      animation: blink 1.2s infinite ease-in-out;
    }
    .pulsing-node {
      transform-origin: center;
      animation: pulseNode 3s infinite ease-in-out;
    }
  </style>

  <!-- Background Grid -->
  <path d="M 0 40 L 800 40 M 0 80 L 800 80 M 0 120 L 800 120 M 200 0 L 200 160 M 400 0 L 400 160 M 600 0 L 600 160" stroke="#1E293B" stroke-width="0.5" opacity="0.3" />

  <!-- Radar Scanner -->
  <circle cx="100" cy="80" r="50" fill="none" stroke="#10B981" stroke-dasharray="2 3" opacity="0.2"/>
  <circle cx="100" cy="80" r="30" fill="none" stroke="#10B981" stroke-dasharray="2 3" opacity="0.4"/>
  <circle cx="100" cy="80" r="10" fill="none" stroke="#10B981" opacity="0.6"/>
  <circle class="radar-circle" cx="100" cy="80" r="10" fill="none" stroke="#10B981" stroke-width="1.5"/>
  <line class="radar-sweep" x1="100" y1="80" x2="100" y2="30" stroke="#10B981" stroke-width="2" opacity="0.8"/>

  <!-- Radar Status Texts -->
  <text x="170" y="55" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="15" font-weight="bold">Competitor Scan Radar</text>
  <circle class="status-dot" cx="178" cy="75" r="4.5" fill="#10B981"/>
  <text x="190" y="79" fill="#10B981" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" letter-spacing="1">ACTIVE MONITORING</text>
  <text x="170" y="108" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11">Polling 6h intervals | Semantic Diff Engine Loaded</text>

  <!-- Flow Pipeline System -->
  <g transform="translate(480, 0)">
    <!-- Connecting flow paths -->
    <path class="flow-line" d="M 60 80 L 110 80" stroke="#38BDF8" stroke-width="1.5" fill="none"/>
    <path class="flow-line" d="M 170 80 L 220 80" stroke="#38BDF8" stroke-width="1.5" fill="none"/>
    <path class="flow-line" d="M 140 95 L 140 125 L 220 125" stroke="#F43F5E" stroke-width="1.5" fill="none"/>

    <!-- Scraper Node -->
    <rect x="-10" y="65" width="70" height="30" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="1"/>
    <text x="25" y="84" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" font-weight="600">Scraper</text>
    
    <!-- Embedder Node -->
    <rect x="110" y="65" width="60" height="30" rx="6" fill="#1E293B" stroke="#38BDF8" stroke-width="1"/>
    <text x="140" y="84" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" font-weight="600">AI Diff</text>
    
    <!-- Notion / CRM Sync Node -->
    <rect x="220" y="65" width="80" height="30" rx="6" fill="#090D16" stroke="#10B981" stroke-width="1.5" />
    <text x="260" y="84" fill="#10B981" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" font-weight="bold">Notion CRM</text>

    <!-- Email Node -->
    <rect x="220" y="110" width="80" height="30" rx="6" fill="#090D16" stroke="#F43F5E" stroke-width="1"/>
    <text x="260" y="128" fill="#F43F5E" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" font-weight="600">Email Digest</text>
  </g>
</svg>

<br/>

[![Notion Enabled](https://img.shields.io/badge/Notion-Connected-black?style=for-the-badge&logo=notion&logoColor=white)](https://notion.so)
[![Slack Alerts](https://img.shields.io/badge/Slack-Enabled-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://slack.com)
[![SMTP Digest](https://img.shields.io/badge/SMTP-Active-ea4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:)
[![ML Embeddings](https://img.shields.io/badge/Embeddings-Local_ONNX-blueviolet?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co)
[![Local LLM](https://img.shields.io/badge/Local_LLM-Qwen_GGUF-cyan?style=for-the-badge&logo=cpu-filler&logoColor=white)](https://huggingface.co)

</div>

---

### 🌟 Project Overview
The **Autonomous Competitor Intelligence Engine** is a fully automated, self-contained competitor monitoring workspace that runs entirely inside a CPU-bound, low-memory environment (optimized for Railway's 512MB RAM free tier). It schedules scraping, compares page edits **semantically** (stripping out headers, footers, and cookie banners to avoid false positives), generates risk/impact scores using a local CPU LLM or Google Gemini, and synchronizes real-time reports to **Notion** or **Airtable** with full idempotency checks.

---

## 🗺️ System Architecture & Workflow

```
                                  +-------------------+
                                  |  Chrome Extension |
                                  +---------+---------+
                                            | (REST API + API Key)
                                            v
+------------------+     Check      +-------------------+
|  Competitor List | -------------> | Sequential Queue  |
+------------------+  (6h Schedule) +---------+---------+
                                            |
                                            v
                                    [1. Scraper] (Axios/Cheerio fallback or Headless Puppeteer)
                                            |
                                            v
                                    [2. Embedder] (all-MiniLM-L6-v2 ONNX)
                                            |
                                            v
                                    [3. Semantic Diff] (Cosine similarity of page structures)
                                            |
                                            +--> If Change Detected:
                                            |
                                            v
                                    [4. Local LLM / Gemini] (Threat analysis & recommendations)
                                            |
                                            v
                                    [5. CRM Adapter] (Idempotent Notion or Airtable sync)
                                            |
                                            +--> If Fail: Enqueue in SQLite Queue
                                            |
                                            v
                                    [6. Slack Notifications] (Immediate alert if Threat Score >= 8)
                                            |
                                            v
                                    [7. Email Digest] (Daily/Weekly summary report)
```

---

## ⚡ Core Technical Features

<details open>
<summary><b>📡 1. Intelligent Double-Engine Scraper (Enrichment Source 1)</b></summary>

*   **Fast Fetch Engine**: Uses standard Axios + Cheerio requests for static layouts.
*   **JS-Heavy Render Engine**: Uses Puppeteer (with styles/images blocked to save resources) to parse dynamic client-side applications.
*   **Anti-Bot & Clean Parser**: Strips out variable layouts (cookie popups, sidebars, headers, footers) to target only relevant content, avoiding false positives.
*   **Visual Snapshot**: Saves screenshot captures of scraping runs to a local `/screenshots` path served statically.
</details>

<details>
<summary><b>🔍 2. Tech Stack & DNS Lookup (Enrichment Source 2)</b></summary>

*   **DNS Resolution**: Checks A and MX records dynamically to inspect server location and email server hosting.
*   **Header Inspection**: Reads HTTP server response headers (e.g., `server`, `x-powered-by`) to map competitor server frameworks.
*   **Dashboard Sidebar**: Displays enriched server technology profiles directly beside competitor listings.
</details>

<details>
<summary><b>🤖 3. Local ONNX Semantic Matching</b></summary>

*   **Embedding Pipeline**: Runs `all-MiniLM-L6-v2` locally using `@huggingface/transformers` in ONNX format.
*   **Text Comparison**: Computes paragraph-level cosine similarity vector differences. Cosmetic shifts (such as a random date string or footer link) do not trigger LLM calls, ensuring resource efficiency.
</details>

<details>
<summary><b>🧠 4. Optimized Subprocess LLM Runner</b></summary>

*   **Subprocess Memory Isolation**: Instead of running GGUF LLMs in-process (which causes memory leak issues and crash spikes in Node.js), it launches a standard C++ `llama-cli` binary.
*   **Instant RAM Release**: Memory used for AI inference is immediately reclaimed by the OS the millisecond analysis finishes.
*   **Platform Auto-Installer**: On boot, the server queries the GitHub API to download the precompiled `llama-cli` executable tailored to your host OS (Linux/macOS) and downloads the 382MB model file from Hugging Face.
</details>

<details>
<summary><b>💼 5. Idempotent CRM Sync & Fail-Safe Queue</b></summary>

*   **Double-Write Protection**: Before writing to Notion or Airtable, the adapter queries the database to match titles and URLs, preventing duplicate writes.
*   **SQLite Retry Queue**: If your Notion token expires or is temporarily disconnected, failed sync cards are saved in a local SQLite table (`crm_queue`) and auto-retried at periodic intervals.
</details>

---

## 🤖 Machine Learning & LLM Configurations

Choose between cloud-hosted inference (Google Gemini) and a fully offline setup:

### Option A: Google Gemini API (Recommended for Cloud / Railway)
Set `GEMINI_API_KEY=your_key` in your `.env` file to run analysis remotely.
*   **Model**: `gemini-2.5-flash`
*   **RAM Footprint**: ~0 MB (Network API call)
*   **Inference Speed**: < 1.5 seconds

### Option B: Local CPU-Bound LLM (100% Offline Fallback)
If no Gemini API key is defined, the engine runs locally on CPU:

| Component | Model Name | Format | Model Size | RAM Footprint | Inference Speed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Embeddings** | `Xenova/all-MiniLM-L6-v2` | ONNX | ~90 MB | ~80 MB | < 0.5 seconds |
| **Local LLM** | `Qwen/Qwen2.5-0.5B-Instruct` | GGUF (Q4_K_M) | ~382 MB | ~350 MB | 7–15s on shared CPU |

---

## 🚀 Local Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   NPM (v10+)
*   macOS, Linux (or Windows via WSL)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/acie.git
cd acie

# Install all components (Root, server, client)
npm install
npm run install:all
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=AIzaSyCC...  # Optional: For Gemini cloud inference
```

### 3. Run Development Servers
Start both backend (Port 3000) and frontend (Port 5173) concurrently:
```bash
npm run dev
```
Open **`http://localhost:5173`** to access the dashboard workspace.

### 4. Running Integration Tests
Verify scraping, embedding, LLM pipelines, and CRM integration locally:
```bash
npm test
```

---

## 🔌 Integration Setup Guides

<details>
<summary><b>🗒️ Notion CRM Configuration (Recommended)</b></summary>

1. Create a Notion integration token at **[Notion My Integrations](https://www.notion.so/my-integrations)**.
2. In your Notion Workspace, create a Database page named **Competitor Intel** and define the following properties exactly:
   *   **Title** &rarr; Type: `Title` (the default first column)
   *   **Competitor Name** &rarr; Type: `Select`
   *   **URL** &rarr; Type: `URL`
   *   **Category** &rarr; Type: `Select`
   *   **Impact Score** &rarr; Type: `Number`
   *   **Recommended Action** &rarr; Type: `Text` (or Rich Text)
   *   **Summary** &rarr; Type: `Text` (or Rich Text)
   *   **Justification** &rarr; Type: `Text` (or Rich Text)
   *   **Screenshot URL** &rarr; Type: `URL`
3. Click the `...` menu on the top right of your database page, go to **Connect to**, search for your integration, and click confirm.
4. Copy the URL of your database page and extract the **Database ID** (the 32-character string between the last `/` and the `?`).
5. Open your dashboard at `http://localhost:5173`, click **Settings**, select **Notion** as active CRM, and save your Token and Database ID.
</details>

<details>
<summary><b>📊 Airtable CRM Configuration</b></summary>

1. Generate a Personal Access Token (PAT) with `data.records:write` scopes at **[Airtable Developer Hub](https://airtable.com/create/tokens)**.
2. Create a Base and a Table named **Competitor Intel** with the following fields:
   *   `Title` (Single line text)
   *   `Competitor Name` (Single line text)
   *   `URL` (URL)
   *   `Category` (Single line text)
   *   `Summary` (Long text)
   *   `Justification` (Long text)
   *   `Impact Score` (Number)
   *   `Recommended Action` (Single line text)
   *   `Screenshot URL` (URL)
   *   `Timestamp` (Single line text)
3. Enter your Base ID, Table name, and Token in the settings panel of your dashboard and save.
</details>

<details>
<summary><b>🧩 Chrome Extension Setup (One-Click Registration)</b></summary>

1. Open Chrome and navigate to **`chrome://extensions/`**.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** in the top left and select the `extension/` directory of this project.
4. Click the extension icon in your toolbar, then select **Configure Server Settings**.
5. Set your server connection URL (e.g., `http://localhost:3000`) and paste the **Extension API Key** (found in your web app Settings tab).
6. Click **Verify and Save**. Now you can register competitors with a single click while browsing!
</details>

<details>
<summary><b>📢 Slack Alerts Webhook</b></summary>

1. Create an Incoming Webhook in your Slack Workspace settings.
2. In the web dashboard Settings panel, input the **Slack Webhook URL**.
3. Any competitor change detected with an **Impact Score >= 8** will trigger an immediate alert message to your Slack channel!
</details>

<details>
<summary><b>📧 SMTP Email Configuration</b></summary>

1. Set up your SMTP server details in the Settings panel. For Gmail, use an **App Password** (`security.google.com` -> App Passwords).
2. Set provider to `smtp`, enter host `smtp.gmail.com`, port `587`, your email, the app password, and a recipient address.
3. Save configurations and click **Test SMTP Connection** to receive a verification email. Periodic digests will now land directly in your inbox.
</details>

---

## 🛠️ Deployment on Railway

The repository includes a production-ready `Dockerfile` optimized to deploy everything in one click:
1. Create a **New Project** on Railway.
2. Link your GitHub repository.
3. Railway reads the `Dockerfile`, handles Chrome installations for scraping, downloads standard binaries, builds static Vite client assets, and exposes standard Express routing.
4. Add the `PORT` environment variable set to `3000`.

---

## ⚠️ Known Limitations & Resource Strategies

*   **Binary Downloader Delay**: On first boot or initial run, the system requires a couple of minutes to fetch the local quantized models and precompiled GGUF runner. Subsequent scans execute instantly.
*   **Anti-Bot Protections**: Some highly secure platforms block headless web scrapers. The system handles this gracefully by extracting text payload fallbacks from pure Axios requests if Puppeteer triggers bot alerts.
*   **Concurrency Queue**: To maintain a memory footprint under 512MB, competitor sites are crawled and analyzed in a strict queue. If many competitors are running, updates will resolve sequentially.

---

<div align="center">
  <sub>Developed by Advanced Agentic Coding. Open source under MIT License.</sub>
</div>

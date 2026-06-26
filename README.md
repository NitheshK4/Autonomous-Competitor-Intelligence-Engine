# Autonomous Competitor Intelligence Engine

The **Autonomous Competitor Intelligence Engine** is a fully automated, self-contained competitor intelligence monitoring system that runs entirely on a CPU-bound, low-memory environment (optimized for Railway's 512MB RAM free tier). It schedules scraping, compares page edits semantically rather than by string diffing, analyzes threat level and recommendations using a local CPU LLM, syncs structured intelligence cards to Notion or Airtable, sends periodic email digests, and integrates with a companion Chrome Extension for one-click URL registration.

---

## Key System Architecture

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
                                    [1. Scraper] (Axios/Cheerio or Headless Puppeteer)
                                            |
                                            v
                                    [2. Embedder] (all-MiniLM-L6-v2 ONNX)
                                            |
                                            v
                                    [3. Semantic Diff] (Paragraph cosine checks)
                                            |
                                            +--> If Change Detected:
                                            |
                                            v
                                    [4. Local LLM] (Qwen2.5-0.5B-Instruct spawned process)
                                            |
                                            v
                                    [5. CRM Adapter] (Idempotent Notion or Airtable sync)
                                            |
                                            +--> If Fail: Enqueue in SQLite Queue
                                            |
                                            v
                                    [6. Email Digest] (Daily/Weekly grouped email)
```

1. **Express & React Frontend**: Served as a single unified server in production. React compiles to static assets, and Express serves it from the same port to save RAM overhead.
2. **Sequential Background Queue**: Prevents OOM (Out Of Memory) crashes by running only one scraping and analysis job at a time.
3. **Double-Engine Scraper**: Uses standard HTTP requests (Cheerio) for speed and fallback Puppeteer (optimized to block styles/images) for dynamic JavaScript pages. Captures screenshots for visual archives.
4. **Local ONNX Embeddings**: Runs `all-MiniLM-L6-v2` locally via `@huggingface/transformers` to compute paragraph-level cosine similarity. Cosmetic shifts (such as footers, navigational changes, and cookie prompts) are stripped out during scraping or ignored during semantic matching.
5. **Local CPU LLM Runner**: Spawns a standalone C++ `llama-cli` process to run a quantized GGUF model and exits immediately upon completion.
6. **Notion & Airtable Integrations**: Supports both CRMs with duplicate checks (idempotency) and a failure queue stored in SQLite.

---

## Machine Learning & LLM Configurations

You can choose between running the system entirely locally or using the Google Gemini API:

### Option A: Google Gemini API (Recommended for Cloud / Railway)
To completely bypass CPU and RAM limits on Railway's free tier, you can configure your Gemini API Key in the `.env` file (`GEMINI_API_KEY=your_key`). 
- **Model**: `gemini-2.5-flash`
- **RAM Footprint**: ~0 MB (API Call)
- **Inference Speed**: < 1.5 seconds
- **Inference Cost**: Free tier compatible

### Option B: Local CPU-bound LLM Fallback (No-Cloud Dependency)
If no API key is specified in `.env`, the system automatically downloads and runs the quantized model locally on CPU:

| Component | Model Name | Quantization / Format | Model Size | RAM Footprint | Inference Speed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Embeddings** | `Xenova/all-MiniLM-L6-v2` | ONNX | ~90 MB | ~80 MB | < 0.5 seconds |
| **Local LLM** | `Qwen/Qwen2.5-0.5B-Instruct` | GGUF (Q4_K_M) | ~382 MB | ~350 MB | 7–15 seconds on CPU |

### Why the Local Option fits Railway Free Tier:
1. **Low Memory Models**: The total RAM required during analysis is under 450MB, fitting comfortably inside Railway's 512MB RAM ceiling.
2. **Subprocess Isolation**: Instead of running the LLM in-process (which causes Node.js garbage collection lag and high memory retention), the application spawns `llama-cli` as a subprocess. The OS instantly reclaims all memory the moment inference completes.
3. **Automatic Downloader**: When the app starts, the server queries the GitHub API to download the precompiled `llama-cli` executable for the host platform (Linux/macOS) and retrieves the GGUF model from Hugging Face automatically. No compiler tools or local C++ configurations are needed.

---

## Local Setup & Run

### Prerequisites
*   Node.js (v18+)
*   NPM (v10+)
*   Linux or macOS environment (Windows supported via WSL)

### 1. Installation
Clone the repository and install all dependencies:
```bash
# Install root, backend, and frontend dependencies
npm install
npm run install:all
```

### 2. Run Development Servers
Start both backend (Port 3000) and Vite React frontend (Port 5173) concurrently:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to complete the onboarding flow.

### 3. Running Verification Tests
Execute the programmatic integration test suite to verify scraping, semantic diffing, LLM execution, and CRM retry loops:
```bash
npm test
```

---

## Deployed on Railway

The application is fully prepared for a one-click Railway deployment.
1. Create a **New Project** on Railway.
2. Connect your public GitHub repository.
3. Railway will read the `Dockerfile`, install system Chrome, download `llama-cli`, install packages, compile the Vite bundle, and deploy the application.
4. Set the following environment variables on Railway if needed (or configure SMTP and CRM in the web UI Settings page directly):
   *   `PORT` = `3000`

---

## Chrome Extension Setup

The Chrome extension allows registering any webpage in one click without leaving the page, and shows a badge alert count for unread intelligence cards.

### 1. Install Unpacked Extension
1. Open Google Chrome and go to `chrome://extensions/`.
2. Toggle **Developer mode** (top right switch).
3. Click **Load unpacked** (top left button).
4. Select the `extension/` directory inside this project folder.

### 2. Configure Extension Settings
1. Click the extension icon in your toolbar, then click **Configure Server Settings**.
2. Set the **Backend Server Connection URL** to your deployed Railway URL (e.g. `https://your-app.up.railway.app`) or local server (`http://localhost:3000`).
3. Set the **Extension API Key** (copy the key displayed in the **Settings** view of your web application).
4. Click **Verify and Save Settings**. The extension will check connection and show a success state.

---

## CRM Integration Configuration

### Notion Setup
1. Create a Notion integration token at `https://www.notion.so/my-integrations`.
2. Create a Database in Notion with the following properties:
   *   `Title` (Title type)
   *   `Competitor Name` (Select type)
   *   `URL` (Url type)
   *   `Category` (Select type)
   *   `Impact Score` (Number type)
   *   `Recommended Action` (Rich Text type)
   *   `Summary` (Rich Text type)
   *   `Justification` (Rich Text type)
   *   `Screenshot URL` (Url type)
3. Share the database with your integration, copy the Database ID, and save them in the web settings.

### Airtable Setup
1. Create a Personal Access Token (PAT) with `data.records:write` scopes at `https://airtable.com/create/tokens`.
2. Create a Base and a Table with the following fields:
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
3. Save the token, Base ID, and Table name in settings.

---

## Known Limitations & Trade-offs
1. **First-Run Download Delay**: On the very first run (or first check), the app will take a few minutes to download the `llama-cli` binary and the 382MB GGUF model file. Subsequent checks run instantly.
2. **CPU-bound Spawning**: LLM inference is CPU-bound. If your server is hosted on a single shared CPU core (e.g. Railway free tier), inference will take around 8-15 seconds per change. The sequential queue handles this gracefully.
3. **Static Screenshot Styling**: When screenshots are captured in static Axios-scraping fallback mode, they are rendered via Puppeteer. If a site has strict anti-bot detection or blocks direct IP downloads, the screenshot may fail or capture a captcha page. The text content, however, is safely extracted.

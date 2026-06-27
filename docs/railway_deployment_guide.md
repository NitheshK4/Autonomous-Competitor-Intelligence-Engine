# 🚀 Railway Deployment Guide

This guide walks you through deploying the **Autonomous Competitor Intelligence Engine (ACIE)** as a unified full-stack application on [Railway](https://railway.app/).

Since the repository already contains a production-ready [Dockerfile](Dockerfile), Railway will automatically detect it, build the container image (installing Node.js, Python, and Google Chrome for Puppeteer), and serve the dashboard on the web.

---

## 📋 Prerequisites

1. A [Railway](https://railway.app/) account.
2. A GitHub repository containing the application code.

---

## 🛠️ Step-by-Step Deployment Steps

### 1️⃣ Import Your GitHub Repository
1. Log in to your **Railway Console**.
2. Click **+ New Project** in the top-right corner.
3. Select **Deploy from GitHub repo**.
4. Choose the repository containing the ACIE codebase.
5. Click **Deploy Now**. 

---

### 2️⃣ Configure Environment Variables
In your Railway project service settings, navigate to the **Variables** tab and add the following:

| Variable Name | Value / Description | Required? |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **Yes** |
| `PORT` | `3000` *(Railway will automatically expose the app on this port)* | **Yes** |
| `GEMINI_API_KEY` | *Your Google Gemini API Key* | **Recommended** (Falls back to local Qwen GGUF if missing) |
| `SLACK_WEBHOOK_URL` | *Your Slack Webhook URL* | Optional (For instant alerts on high-impact changes) |
| `SMTP_HOST` | *SMTP host server (e.g. smtp.gmail.com)* | Optional (For email digests) |
| `SMTP_PORT` | *SMTP port (e.g., 587 or 465)* | Optional (For email digests) |
| `SMTP_USER` | *SMTP user email* | Optional (For email digests) |
| `SMTP_PASS` | *SMTP password / app-specific password* | Optional (For email digests) |
| `SMTP_FROM` | *Sender email address* | Optional (For email digests) |

---

### 3️⃣ Configure Persistent Volume Mounts
Because SQLite database files and captured screenshots are stored locally, **Railway's ephemeral filesystem will delete them on every restart or deployment** unless we mount a persistent volume.

#### Database Persistence
1. In your service configuration on Railway, go to the **Settings** tab.
2. Scroll down to the **Volumes** section and click **+ Add Volume**.
3. Configure the volume:
   - **Mount Path**: `/app/server/data`
   - **Size**: `1 GB` to `5 GB` is more than enough for SQLite records.
4. Save the volume settings.

#### Screenshots Persistence (Optional but Recommended)
To preserve the visual audit screenshots captured by the scraper across redeployments:
1. Click **+ Add Volume** again.
2. Configure the second volume:
   - **Mount Path**: `/app/server/public/screenshots`
   - **Size**: `5 GB` (depending on how many competitors and screenshots you plan to keep).
3. Save the settings.

---

### 4️⃣ Expose Public Domain / Host URL
1. Go to the **Settings** tab of your service.
2. Under the **Networking** section, click **Generate Domain** (or set up a custom domain).
3. Railway will generate a public URL like `https://xxx.up.railway.app`.
4. Copy this domain! It will be set as your `RAILWAY_STATIC_URL` automatically by Railway, which our app uses to configure the extension and email callback paths.

---

## 🧩 Linking the Chrome Extension

Once deployed, you can point your local Chrome Extension to the live production server:

1. Open your Chrome browser and navigate to `chrome://extensions/`.
2. Find the **ACIE Extension** and click **Details** → **Extension options** (or click the extension icon and click **Configure Server Settings**).
3. Update the **Server URL** to your generated Railway domain (e.g., `https://your-app.up.railway.app`).
4. Copy the API Key from your live Dashboard's **Settings** tab and paste it into the Extension Options.
5. Click **Verify and Save**.

---

## 🔍 Verification & Logs

- **Application Logs**: You can view the build and runtime logs in the **Logs** tab on Railway. You should see:
  ```text
  Server is running on port 3000
  Application Host URL configured: https://xxx.up.railway.app
  Background competitor check scheduler started.
  Background email digest scheduler started.
  ```
- **Live Status**: Visit your public Railway URL to access the dashboard, view the monitored competitors, and add new ones in real-time!

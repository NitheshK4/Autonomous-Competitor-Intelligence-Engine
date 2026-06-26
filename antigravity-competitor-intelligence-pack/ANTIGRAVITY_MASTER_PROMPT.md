# Antigravity Master Prompt

Build my internship project as a complete production-ready submission called **Autonomous Competitor Intelligence Engine**.

Important: do not skip any requirement in this prompt unless it is explicitly marked as a bonus task.

## Goal

Create a full web app plus Chrome extension that monitors competitor webpages, detects meaningful changes using semantic comparison instead of string diffing, scores business impact using a local CPU-bound LLM, pushes structured intelligence cards into **either Notion or Airtable**, sends digest emails, and is deployable on **Railway free tier**.

The final product must be clean enough that a **non-technical user can use it without reading the README**.

## Core Product Summary

The system should help a business track competitor activity such as:

- price changes
- new feature launches
- new job postings
- new blog content
- leadership changes

The system must:

- monitor a configurable list of competitor URLs on a schedule
- scrape content on a configurable interval
- detect meaningful page changes semantically
- ignore cosmetic or navigational noise
- classify the type of change with a model, not a ruleset
- run local LLM impact scoring using the user's business context
- create intelligence cards
- sync those cards to Notion or Airtable
- retry failed CRM writes
- send digest emails daily or weekly
- include a Chrome extension that can add a webpage to monitoring in one click
- show unread intelligence count as an extension badge

## Non-Negotiable Constraints

- The entire system must run on **Railway free tier**.
- No paid APIs.
- No paid proxy service.
- All ML inference must run **locally and CPU-bound**.
- The scraper must support at least:
  - static HTML pages
  - JavaScript-rendered pages using a lightweight headless approach
  - pages with basic bot-detection like user-agent checks and simple rate limiting
- Minimum scrape interval on Railway free tier must be **every 6 hours**.
- Semantic change detection is mandatory.
- String diffing alone is not acceptable.
- The classifier must use a **model**, not a ruleset.
- LLM inference must complete in **under 90 seconds per change** on Railway CPU.
- The Chrome extension must work **without user login**.
- The extension must use a **pre-configured API key** that the user pastes into extension settings once.
- The Chrome extension must be loadable in Chrome developer mode as:
  - an unpacked extension with no build step, or
  - a zip that loads in one step
- The deployed Railway URL must be live and functional at submission time.
- All source code must be in a public GitHub repository.

## Reduced Scope Rule Because This Assignment Includes a Chrome Extension

- Support only **2 enrichment sources per competitor**.
- CRM sync only needs **Notion or Airtable**, not both.

## Required Architecture Expectations

Choose a lean architecture that fits Railway free tier and is simple to understand.

Strong preference:

- web app + API backend in one repo
- lightweight database
- scheduled background job or cron-safe polling flow
- lightweight headless browser only when needed
- local embeddings model for semantic comparison
- local small instruct model for impact scoring and classification
- storage for scraped versions, intelligence cards, and CRM retry queue

Document clearly in the README:

- chosen model name
- chosen model size
- average inference time
- RAM usage
- why the models fit Railway free tier

## Required Features

### 1. Web Scraping and Change Detection Pipeline

Build a scheduled scraping pipeline for each monitored URL.

Requirements:

- scrape each monitored URL on a configurable interval
- enforce a minimum practical interval of every 6 hours for Railway free tier safety
- store previous and current scraped content
- detect whether the page changed in a meaningful way
- use semantic change detection by embedding previous and current content and computing similarity
- use a configurable semantic threshold
- filter out noise such as:
  - cookie banners
  - footer updates
  - ad rotation
  - purely navigational changes

Semantic examples that must be handled correctly:

- "Price: $100" to "Current Price: $100" = no meaningful change
- "Price: $100" to "Price: $70" = meaningful pricing change

Every detected change must be classified into one of these categories:

- pricing change
- product or feature update
- hiring signal
- content or messaging shift
- leadership or company change
- other

The classifier must use a model.

### 2. LLM Impact Scoring

For every classified change, run a local CPU-bound LLM that returns:

- a one-paragraph plain-English summary of what changed and why it matters
- a business impact score from 1 to 10 with a brief justification
- a recommended action for the user’s business

Examples of recommendation style:

- "Consider a pricing response within 30 days"
- "Monitor their hiring in this area for the next quarter"

The LLM must use business profile context collected during onboarding:

- what the user’s product does
- who their customers are
- what their price point is

Impact must be relative to the user’s business context, not generic.

Example:

- a competitor feature that overlaps directly with the user’s core product should score higher than an unrelated feature launch

### 3. CRM Integration

Every intelligence card must include:

- competitor name
- URL
- change category
- summary
- impact score
- recommended action
- timestamp
- link to a screenshot or archived version of the changed page

Push every intelligence card into **either Notion or Airtable**.

CRM requirements:

- integration must be idempotent
- running the pipeline twice on the same change must not create duplicate CRM records
- if a CRM write fails, queue the record locally
- retry queued records on the next pipeline run
- failed writes must be visible in the web UI with a clear status indicator
- failed writes must never be silently dropped

### 4. Digest Email

Implement digest email sending on a configurable schedule:

- daily or weekly

Digest requirements:

- summarise all intelligence cards since the last digest
- group by competitor
- sort by impact score descending
- highlight top 3 highest-impact changes
- send using a free SMTP option such as Gmail SMTP, Resend free tier, or Mailgun free tier
- do not send a digest if there were no new changes in the period

### 5. Chrome Extension

Build a Chrome extension that:

- lets the user add the current tab URL to the monitored competitor list in one click
- shows a popup with:
  - pre-filled URL field
  - label field for competitor name
  - monitor scope selector with:
    - full page
    - pricing section only
    - careers section only
- sends the configuration to the Railway backend when the user clicks Add
- confirms success or failure in the popup
- works without login
- stores and uses a pasted API key from extension settings
- shows a badge count of unread intelligence cards across all monitored competitors
- updates the badge count whenever the browser is open

Extension delivery requirement:

- evaluator must be able to load it immediately in Chrome developer mode

### 6. UI Requirements

The web interface must be clean, labelled, intuitive, and usable without instructions.

Required views:

1. Dashboard home screen
   Must show:
   - competitor cards
   - competitor name
   - last checked time
   - number of changes detected this week
   - current monitoring status: active, paused, or error

2. Intelligence feed
   Must show:
   - all detected changes in reverse chronological order
   - filtering by competitor
   - filtering by change category
   - card summary
   - colour-coded impact score badge
   - recommended action
   - link to archived page diff

3. Competitor detail page
   Must show:
   - full change history for one competitor
   - chart of impact scores over time
   - monitoring settings for that competitor

4. Onboarding flow
   Must collect:
   - business profile for LLM context
   - field-level guidance for what to enter

5. Settings page
   Must include:
   - digest email configuration
   - API key management

## Testing Requirements

Implement and document the following tests or test flows.

### 1. Scraper Tests

Test 1: scrape a static website

Input:

- `https://example.com`

Expected:

- HTML fetched
- text extracted
- stored in database

Test 2: scrape a JavaScript website

Input:

- `https://openai.com`

Expected:

- dynamic content loaded
- text extracted

Test 3: second scrape works

Flow:

- scrape #1
- store
- scrape #2
- compare

Expected:

- previous version exists
- current version exists

### 2. Semantic Change Detection Tests

Test 1:

- old: `Price: $100`
- new: `Current Price: $100`
- expected: no meaningful change

Test 2:

- old: `Price: $100`
- new: `Price: $70`
- expected: meaningful change detected

Test 3:

- old: cookie banner updated
- expected: ignored

Test 4:

- old: `We sell AI tools.`
- new: `We now provide AI Agents.`
- expected: content shift detected

Test 5:

- old: careers page
- new: `Hiring 20 AI Engineers`
- expected: hiring signal

Also ensure the pipeline distinguishes meaningful from cosmetic changes across **at least 5 real test URLs** covering different change types.

### 3. Change Classification Tests

Input:

- `We launched GPT Vision.`
- expected: Feature Update

Input:

- `Now hiring ML Engineers.`
- expected: Hiring Signal

Input:

- `Price reduced by 30%.`
- expected: Pricing Change

Input:

- `CEO changed.`
- expected: Leadership Change

### 4. Scheduler Tests

Expected:

- scheduler starts
- scrapes automatically
- saves data

### 5. LLM Tests

Input:

- competitor reduced prices

Expected output includes:

- summary
- impact score
- recommendation

Example shape:

- Summary: Competitor reduced pricing.
- Impact: 9/10
- Recommendation: Review pricing strategy.

Also ensure the local LLM finishes within **90 seconds** on Railway CPU.

### 6. CRM Tests

Flow:

- generate intelligence card
- expected: record added to Notion or Airtable
- run again
- expected: no duplicate record

This tests idempotency.

Failure flow:

- turn off internet or simulate CRM failure
- expected: CRM write failed
- expected: stored in retry queue
- next run: retry succeeds

### 7. Email Tests

Flow:

- generate three intelligence cards
- send digest

Expected:

- email received
- grouped by competitor
- sorted by impact
- top 3 highlighted

When no changes exist:

- no email sent

### 8. Chrome Extension Tests

Flow:

- open webpage
- click extension
- expected: URL auto-filled
- click Add
- expected: competitor appears in backend
- generate changes
- expected: badge count increases

Example badge:

- `3`

### 9. UI Tests

Dashboard should show:

- competitor
- last checked
- status
- weekly changes

Feed should show:

- summary
- impact
- category
- recommendation

Competitor page should show:

- history
- chart
- settings

### 10. Railway Deployment Tests

Open:

- `yourapp.up.railway.app`

Expected:

- loads successfully
- add competitor works
- scheduler runs
- new intelligence card generated

### 11. README Tests

Someone should be able to:

- clone
- install
- run
- deploy

using only the README.

## Day-by-Day Delivery Plan

Day 1:

- project scaffold
- database schema
- basic scraper working
- single URL can be scraped
- content stored
- second scrape can produce a diff
- API can add a URL and retrieve scraped content

Day 2:

- semantic change detection working
- change classifier working
- meaningful vs cosmetic changes tested on at least 5 URLs
- scheduler running on configurable interval

Day 3:

- LLM impact scoring integrated
- output meaningful within Railway limits
- CRM push working
- idempotency working
- retry logic working
- intelligence cards visible in web interface

Day 4:

- digest email working
- digest formatting correct
- Chrome extension built
- extension connected to Railway backend
- badge count updating correctly

Day 5:

- full UI polish
- complete error handling
- README written
- Railway deployment stable and documented
- stranger can use app without guidance

## Bonus Tasks

If time allows, implement these after all core requirements are complete:

- screenshot archiving with before/after visual diff
- Slack webhook notification for high-impact changes with score 8+
- competitor relationship graph inferred from backlinks
- RSS/blog monitoring where each new post becomes a change event

## Evaluation Criteria You Must Optimize For

- deployed Railway URL works
- stranger can complete the full flow without guidance
- semantic change detector filters real-world noise meaningfully
- LLM impact scores are relevant to business context
- CRM integration is idempotent
- CRM failure handling works correctly
- Chrome extension installs cleanly
- Chrome extension communicates reliably with backend
- UI is clean, labelled, and self-explanatory
- code is structured so a stranger can understand and extend it
- README tells the full story

## Final Deliverables

Produce everything needed for submission:

- public GitHub repository with all code
- Dockerfiles and configuration
- no secrets committed
- live Railway URL functional at submission time
- Chrome extension zip or unpacked folder that loads in one step
- README covering:
  - architecture
  - setup
  - deployment
  - model choices
  - model memory footprint
  - known limitations
- screen recording or written walkthrough under 3 minutes showing:
  - add competitor
  - detect change
  - create intelligence card
  - push to CRM

## Required Output From You

I want you to generate the project in a way that is practical to run, easy to review, and easy to submit.

Please:

- create a complete codebase
- keep the structure clean and readable
- include a polished UI
- include extension files ready to load
- include clear environment variable examples
- include setup and deployment documentation
- include test instructions
- include sample data or dev helpers where useful
- prefer the simplest stable implementation that satisfies all requirements
- explicitly mention any unavoidable limitations

## Final Rule

Before you finish, cross-check every implemented feature against every required point in this prompt and make sure nothing mandatory is skipped.

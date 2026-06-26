# Master Build Prompt

Build my internship project as a complete, submission-ready product with the exact project name:

**Autonomous Competitor Intelligence Engine**

Use that exact project name in:

- repository title
- README title
- app title
- browser page title
- dashboard header
- deployment description
- final deliverables

Do not skip any mandatory point in this prompt.

## Your Role

Act like a senior full-stack engineer building a real internship submission that will be reviewed by evaluators. Optimize for:

- correctness
- completeness
- clarity
- clean architecture
- Railway free tier compatibility
- polished non-technical user experience
- easy submission and review

If a design choice must be made, prefer the simplest stable implementation that satisfies all assignment constraints.

## Core Objective

Create a full web app plus Chrome extension that continuously monitors competitor webpages, detects meaningful changes semantically, classifies changes with a model, scores business impact with a local CPU-bound LLM, syncs intelligence cards to Notion or Airtable, sends digest emails, and runs on Railway free tier.

The user of this product should be able to:

- add a competitor
- choose what to monitor
- configure monitoring
- see meaningful intelligence cards
- understand business impact
- view CRM sync status
- receive digest emails
- use the Chrome extension without logging in

The UI must be understandable without needing the README.

## Full Assignment Context

A business wants to know what its competitors are doing at all times, including:

- price changes
- new feature launches
- job postings that suggest a strategic pivot
- new blog content
- leadership changes

Right now this is done manually. This system must automate the process.

## Hard Constraints

These are non-negotiable:

- entire system must run on Railway free tier
- no paid APIs
- no paid proxies
- all ML inference must run locally and CPU-bound
- semantic change detection is mandatory
- string diffing alone is not acceptable
- classifier must use a model, not a ruleset
- local LLM must stay under 90 seconds per change on Railway CPU
- Chrome extension must work without login
- Chrome extension must use a pasted API key in settings
- extension must be loadable as unpacked extension with no build step, or as a zip that loads in one step
- Railway deployment URL must be live and functional at submission time
- source code must be in a public GitHub repository
- README must fully explain setup, run, deploy, architecture, model choice, memory footprint, and limitations

## Reduced Scope Rule

Because this version includes the Chrome extension:

- only 2 enrichment sources per competitor are required
- CRM integration only needs Notion or Airtable, not both

## Implementation Expectations

Build this as a real, practical system. Make it easy to run, easy to review, and easy to submit.

Strong preferences:

- one clean monorepo or one simple full-stack app structure
- lightweight database
- background job or scheduler approach that works on Railway free tier
- lightweight headless rendering for JavaScript pages
- small local embedding model for semantic comparison
- small local instruct model for classification and impact scoring
- durable storage for scrape history, intelligence cards, digest history, retry queue, and monitoring configuration
- simple, consistent API design
- clean file structure
- useful environment example file
- clear error states in the UI

If you choose a stack, choose one that is realistic for Railway free tier and explain why.

## Must-Have Product Features

### 1. Competitor Monitoring Pipeline

Implement a scheduled scraping pipeline for each monitored competitor URL.

Required behavior:

- user can add a competitor URL
- user can give the competitor a label or name
- user can choose what section to monitor
- system scrapes on a configurable schedule
- the practical minimum schedule must be every 6 hours to avoid free-tier issues
- previous and current versions of content must be stored
- pages must be handled reliably enough for real evaluation

The scraper must support at minimum:

- static HTML pages
- JavaScript-rendered pages using a lightweight headless method that fits Railway memory limits
- basic bot-detection situations such as:
  - user-agent checks
  - simple rate limiting

### 2. Semantic Change Detection

This is one of the most important parts.

Implement meaningful change detection using semantic comparison, not plain string diffing.

Required behavior:

- embed previous version of content
- embed current version of content
- compute similarity or semantic distance
- use a configurable threshold
- flag only meaningful changes
- ignore cosmetic, layout, or navigational noise

Noise to filter out:

- cookie banner changes
- footer updates
- ad rotation
- nav-only changes
- non-meaningful rewrites that keep the same intent

Examples that must behave correctly:

- `Price: $100` -> `Current Price: $100` = no meaningful change
- `Price: $100` -> `Price: $70` = meaningful pricing change
- cookie banner text update = ignored
- `We sell AI tools.` -> `We now provide AI Agents.` = messaging shift
- `Careers` page -> `Hiring 20 AI Engineers` = hiring signal

### 3. Model-Based Change Classification

Every meaningful detected change must be classified using a model, not a rules engine.

Supported categories:

- pricing change
- product or feature update
- hiring signal
- content or messaging shift
- leadership or company change
- other

### 4. Local LLM Impact Scoring

For every meaningful classified change, run a local CPU-bound LLM and produce:

- a one-paragraph plain-English summary of what changed
- a one-paragraph explanation of why it matters
- an impact score from 1 to 10
- a brief justification for the score
- a recommended action for the user’s business

Examples of recommended action style:

- `Consider a pricing response within 30 days.`
- `Monitor their hiring in this area for the next quarter.`

The LLM must use onboarding context from the user’s own business profile:

- what the product does
- who the customers are
- what the price point is

Impact must be relative to the business profile, not generic.

Higher score example:

- competitor launches a feature directly overlapping the user’s core product

Lower score example:

- competitor launches something outside the user’s segment

Performance requirement:

- each inference must complete within 90 seconds on Railway CPU

Documentation requirement:

Explain in the README:

- exact model name
- model size
- average inference time
- approximate RAM usage
- why the model choice is suitable for Railway free tier

### 5. Intelligence Cards

Every meaningful change must generate an intelligence card.

Every card must include:

- competitor name
- competitor URL
- change category
- summary
- impact score
- justification
- recommended action
- timestamp
- CRM sync status
- link to screenshot or archived page version

### 6. CRM Integration

Push intelligence cards into exactly one of these:

- Notion
- Airtable

CRM requirements:

- idempotent sync
- same change processed twice must not create duplicates
- failed writes must be stored locally in a retry queue
- retry must happen on the next pipeline run
- failed syncs must be visible in the web UI
- failures must never be silently dropped

### 7. Digest Email

Support digest emails on a configurable schedule.

Required options:

- daily
- weekly

Digest behavior:

- include all intelligence cards since the last digest
- group items by competitor
- sort within digest by impact score descending
- highlight top 3 highest-impact changes
- do not send if there are no new changes

Allowed delivery choices:

- Gmail SMTP with app password
- Resend free tier
- Mailgun free tier

### 8. Chrome Extension

Build a Chrome extension that works cleanly for evaluators.

Popup requirements:

- pre-filled URL of current tab
- competitor label field
- monitor scope selector

Monitor scope options:

- full page
- pricing section only
- careers section only

Behavior requirements:

- clicking Add sends the data to the Railway backend
- popup confirms success or failure
- no login required
- user pastes API key once in extension settings
- extension stores and uses that API key
- unread intelligence badge count appears on the extension icon
- badge count updates whenever the browser is open

Packaging requirement:

- evaluator must be able to load the extension in one step

### 9. Web UI Requirements

The UI must be clean, labelled, intuitive, and usable without instructions.

Required views:

#### Dashboard

Must show competitor cards with:

- competitor name
- last checked time
- number of changes detected this week
- monitoring status

Supported status values:

- active
- paused
- error

#### Intelligence Feed

Must show:

- all detected changes
- reverse chronological order
- filter by competitor
- filter by category

Each feed card must show:

- summary
- impact score as a colour-coded badge
- recommended action
- archived diff or archive link

#### Competitor Detail Page

Must show:

- full change history
- impact score trend chart
- monitoring configuration controls

#### Onboarding Flow

Must collect:

- business profile
- what the product does
- who the customers are
- price point

Must include field-level help text so a non-technical user understands what to enter.

#### Settings Page

Must include:

- digest email configuration
- API key management

### 10. Error Handling and Reliability

Build proper user-facing error handling for:

- scrape failure
- timeout
- unsupported page
- CRM sync failure
- email send failure
- extension API failure
- bad API key
- empty results

The app should never feel broken or silent.

## Testing Requirements

Implement the system so that the following tests pass. Document the test flows clearly.

### Scraper Tests

Test 1:

- input: `https://example.com`
- expected:
  - HTML fetched
  - text extracted
  - stored in database

Test 2:

- input: `https://openai.com`
- expected:
  - dynamic content loaded
  - text extracted

Test 3:

- scrape once
- store result
- scrape second time
- compare
- expected:
  - previous version exists
  - current version exists

### Semantic Change Detection Tests

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

Also test at least 5 real URLs covering different change types.

### Change Classification Tests

- `We launched GPT Vision.` -> Feature Update
- `Now hiring ML Engineers.` -> Hiring Signal
- `Price reduced by 30%.` -> Pricing Change
- `CEO changed.` -> Leadership Change

### Scheduler Tests

Expected:

- scheduler starts
- scrapes automatically
- saves data

### LLM Tests

Input:

- competitor reduced prices

Expected output includes:

- summary
- impact score
- recommendation

Also verify:

- inference finishes under 90 seconds on Railway CPU

### CRM Tests

Flow:

- generate intelligence card
- verify CRM record created
- run same change again
- verify no duplicate record

Failure test:

- simulate CRM failure
- verify queued retry record
- verify next run retries successfully

### Email Tests

Flow:

- generate at least three intelligence cards
- send digest
- verify:
  - email received
  - grouped by competitor
  - sorted by impact
  - top 3 highlighted

No-change test:

- if no new cards exist, no email should be sent

### Chrome Extension Tests

Flow:

- open webpage
- click extension
- verify current URL auto-filled
- click Add
- verify competitor appears in backend
- generate unread intelligence
- verify badge count increases

### UI Tests

Dashboard must show:

- competitor
- last checked
- status
- weekly changes

Feed must show:

- summary
- impact
- category
- recommendation

Competitor page must show:

- history
- chart
- settings

### Railway Deployment Tests

Verify deployed URL:

- loads successfully
- can add competitor
- scheduler runs
- intelligence card is generated

### README Tests

A stranger should be able to:

- clone
- install
- run
- deploy

using only the README.

## Day-by-Day Execution Plan

Follow this delivery plan:

### Day 1

- scaffold project
- define schema
- implement basic scraper
- scrape single URL
- store content
- produce second-scrape diff
- add API route to create URL and retrieve content

### Day 2

- implement semantic change detection
- implement model-based change classifier
- validate against at least 5 URLs
- make scheduler configurable and working

### Day 3

- integrate local LLM impact scoring
- ensure output quality and timing
- implement CRM sync
- implement idempotency
- implement retry queue
- show intelligence cards in UI

### Day 4

- implement digest email
- finish digest formatting
- build Chrome extension
- connect extension to backend
- implement unread badge updates

### Day 5

- full UI polish
- complete error handling
- finish README
- stabilise Railway deployment
- verify stranger can use it without guidance

## Bonus Tasks

Only do these after all mandatory requirements are complete:

- screenshot archiving with visual before/after comparison
- Slack webhook notification for high-impact changes with score 8 or above
- competitor relationship graph inferred from backlinks
- RSS and blog monitoring where each new post becomes its own change event

## Deliverables

Produce all of these:

- public GitHub repository
- full source code
- Dockerfiles
- configuration files
- no secrets committed
- live Railway URL
- unpacked Chrome extension folder or one-step zip
- complete README
- short screen recording or written walkthrough under 3 minutes

The README must include:

- architecture
- setup
- local run instructions
- deployment steps
- model choices
- model size
- inference timing
- RAM footprint
- known limitations

The walkthrough must show:

- adding a competitor
- scraping and detecting a change
- generating an intelligence card
- syncing to CRM

## Output Quality Rules

When building this project:

- keep the codebase well-structured
- name files and folders clearly
- keep the UI polished
- keep labels self-explanatory
- include helpful empty states
- include helpful loading states
- include clear error states
- avoid overengineering
- prefer practical, reviewable code
- explain tradeoffs when necessary

## Final Verification Rule

Before finishing, cross-check every implemented feature against every requirement in this prompt and confirm that no mandatory point has been skipped.

If any point is incomplete, explicitly list it and fix it before treating the project as done.

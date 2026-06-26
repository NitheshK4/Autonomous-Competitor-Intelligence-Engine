# Requirements Checklist

Use this as the final no-skip checklist.

## Overview

- [ ] Build **Autonomous Competitor Intelligence Engine** as a web app plus Chrome extension.
- [ ] Track competitor activity such as price changes, feature launches, job postings, blog content, and leadership changes.
- [ ] Monitor a configurable list of competitor URLs on a schedule.
- [ ] Detect meaningful changes using semantic comparison, not simple string diffing.
- [ ] Assess business impact using a local CPU-bound LLM.
- [ ] Push intelligence cards to **Notion or Airtable**.
- [ ] Send digest email on a configurable schedule.
- [ ] Allow adding monitored pages from a Chrome extension in one click.
- [ ] Ensure the UI is clean and understandable without reading the README.

## Section 1: Web Scraping and Change Detection Pipeline

- [ ] Build a scheduled scraping pipeline.
- [ ] Support configurable scrape intervals.
- [ ] Keep minimum Railway-safe interval at every 6 hours.
- [ ] Scrape static HTML pages.
- [ ] Scrape JavaScript-rendered pages using a lightweight headless approach.
- [ ] Handle basic bot-detection such as user-agent checks and simple rate limiting.
- [ ] Store previous scrape content.
- [ ] Store current scrape content.
- [ ] Detect meaningful changes semantically.
- [ ] Use embeddings for previous and current versions.
- [ ] Compute similarity or semantic distance.
- [ ] Use a configurable threshold for flagging meaningful changes.
- [ ] Filter out cosmetic and navigational noise.
- [ ] Ignore cookie banner changes.
- [ ] Ignore footer updates.
- [ ] Ignore ad rotation.
- [ ] Ignore purely navigational changes.
- [ ] Do not rely on string diffing as the actual change detector.
- [ ] Correctly treat wording-only same-price changes as not meaningful.
- [ ] Correctly treat actual price drops as meaningful.
- [ ] Classify each detected change with a model.
- [ ] Support these categories:
- [ ] Pricing change
- [ ] Product or feature update
- [ ] Hiring signal
- [ ] Content or messaging shift
- [ ] Leadership or company change
- [ ] Other

## Section 2: LLM Impact Scoring

- [ ] Pass every classified change to a local LLM.
- [ ] Run the model CPU-bound.
- [ ] Fit within Railway memory limits.
- [ ] Produce a one-paragraph plain-English summary.
- [ ] Produce an impact score from 1 to 10.
- [ ] Include brief justification for impact score.
- [ ] Produce a recommended action.
- [ ] Use business profile context from onboarding.
- [ ] Business profile includes what the product does.
- [ ] Business profile includes who the customers are.
- [ ] Business profile includes price point.
- [ ] Make impact relative to user business context.
- [ ] Keep inference under 90 seconds per change on Railway CPU.
- [ ] Document model name in README.
- [ ] Document model size in README.
- [ ] Document average inference time in README.
- [ ] Document RAM usage in README.

## Section 3: CRM Integration

- [ ] Build intelligence cards with competitor name.
- [ ] Include monitored URL.
- [ ] Include change category.
- [ ] Include summary.
- [ ] Include impact score.
- [ ] Include recommended action.
- [ ] Include timestamp.
- [ ] Include screenshot or archived page link.
- [ ] Push records to Notion or Airtable.
- [ ] Ensure CRM writes are idempotent.
- [ ] Prevent duplicate CRM records when the same change is processed twice.
- [ ] Queue failed CRM writes locally.
- [ ] Retry failed CRM writes on next pipeline run.
- [ ] Show failed CRM write status in web UI.
- [ ] Do not silently drop failed CRM writes.

## Section 4: Digest Email

- [ ] Allow configurable digest schedule.
- [ ] Support daily digest.
- [ ] Support weekly digest.
- [ ] Summarise all intelligence cards since last digest.
- [ ] Group digest by competitor.
- [ ] Sort digest items by impact score descending.
- [ ] Highlight top 3 highest-impact changes.
- [ ] Use a free SMTP option.
- [ ] Do not send a digest when there are no new changes.

## Section 5: Chrome Extension

- [ ] Build a Chrome extension.
- [ ] Let user add current browser tab URL in one click.
- [ ] Show pre-filled URL field in popup.
- [ ] Show label field for competitor name.
- [ ] Show monitor scope selector.
- [ ] Support full page scope.
- [ ] Support pricing section only scope.
- [ ] Support careers section only scope.
- [ ] Send data to Railway backend on Add.
- [ ] Show success state in popup.
- [ ] Show failure state in popup.
- [ ] Work without login.
- [ ] Use pasted API key in extension settings.
- [ ] Show unread intelligence badge count.
- [ ] Update badge while browser is open.
- [ ] Make extension loadable as unpacked extension with no build step, or zip that loads in one step.

## Section 6: UI Requirements

- [ ] Dashboard home screen exists.
- [ ] Dashboard shows competitor cards.
- [ ] Dashboard shows competitor name.
- [ ] Dashboard shows last checked time.
- [ ] Dashboard shows number of changes detected this week.
- [ ] Dashboard shows monitoring status.
- [ ] Monitoring status supports active.
- [ ] Monitoring status supports paused.
- [ ] Monitoring status supports error.
- [ ] Intelligence feed exists.
- [ ] Feed shows detected changes in reverse chronological order.
- [ ] Feed supports filter by competitor.
- [ ] Feed supports filter by change category.
- [ ] Feed card shows summary.
- [ ] Feed card shows colour-coded impact score badge.
- [ ] Feed card shows recommended action.
- [ ] Feed card links to archived page diff.
- [ ] Competitor detail page exists.
- [ ] Competitor detail page shows full change history.
- [ ] Competitor detail page shows impact score chart over time.
- [ ] Competitor detail page shows monitoring settings controls.
- [ ] Onboarding flow exists.
- [ ] Onboarding collects business profile.
- [ ] Onboarding provides field-level guidance.
- [ ] Settings page exists.
- [ ] Settings page allows digest email configuration.
- [ ] Settings page allows API key management.
- [ ] Entire UI is clean, labelled, and usable without instructions.

## Constraints

- [ ] Entire system runs on Railway free tier.
- [ ] All services fit Railway free tier.
- [ ] Scheduler fits Railway free tier.
- [ ] Database fits Railway free tier.
- [ ] Background workers fit Railway free tier.
- [ ] No paid APIs are used.
- [ ] No paid proxy service is used.
- [ ] All ML inference is CPU-bound.
- [ ] Railway URL is live and functional at submission time.
- [ ] Source code is in a public GitHub repository.

## Reduced Scope Because Chrome Extension Is Included

- [ ] Only 2 enrichment sources per competitor are required.
- [ ] Only Notion or Airtable integration is required, not both.

## Day-by-Day Timeline

- [ ] Day 1: project scaffold complete.
- [ ] Day 1: database schema complete.
- [ ] Day 1: basic scraper working.
- [ ] Day 1: single URL can be scraped.
- [ ] Day 1: content can be stored.
- [ ] Day 1: second scrape can produce a diff.
- [ ] Day 1: API can add a URL and retrieve scraped content.
- [ ] Day 2: semantic change detection working.
- [ ] Day 2: change classifier working.
- [ ] Day 2: 5 test URLs used for different change types.
- [ ] Day 2: scheduler running on configurable interval.
- [ ] Day 3: LLM impact scoring integrated.
- [ ] Day 3: LLM output meaningful within Railway limits.
- [ ] Day 3: CRM push working.
- [ ] Day 3: idempotency working.
- [ ] Day 3: retry logic working.
- [ ] Day 3: intelligence cards visible in web interface.
- [ ] Day 4: digest email working.
- [ ] Day 4: digest format correct.
- [ ] Day 4: Chrome extension built.
- [ ] Day 4: extension connected to Railway backend.
- [ ] Day 4: badge count updating correctly.
- [ ] Day 5: full UI polish complete.
- [ ] Day 5: error handling complete.
- [ ] Day 5: README written.
- [ ] Day 5: Railway deployment stable and documented.
- [ ] Day 5: stranger can use app without guidance.

## Bonus Tasks

- [ ] Screenshot archiving with visual before/after diff.
- [ ] Slack webhook for high-impact changes with score 8 or above.
- [ ] Competitor relationship graph from backlink analysis.
- [ ] RSS/blog monitoring where each new post becomes its own change event.

## Evaluation Criteria

- [ ] Railway URL works.
- [ ] Stranger can complete full flow without guidance.
- [ ] Semantic detector filters out noise meaningfully.
- [ ] LLM impact scores are relevant to business context.
- [ ] CRM integration is idempotent.
- [ ] CRM failure handling works correctly.
- [ ] Chrome extension installs cleanly.
- [ ] Chrome extension communicates reliably with backend.
- [ ] UI is clean, labelled, and needs no explanation.
- [ ] Code is structured so a stranger can understand and extend it.
- [ ] README tells a complete story.

## Deliverables

- [ ] Public GitHub repository with all code.
- [ ] Dockerfiles included.
- [ ] Configuration included.
- [ ] No secrets committed.
- [ ] Live Railway URL functional at submission time.
- [ ] Chrome extension zip or unpacked folder loads in one step.
- [ ] README covers architecture.
- [ ] README covers setup.
- [ ] README covers deployment.
- [ ] README covers model choices.
- [ ] README covers memory footprint.
- [ ] README covers known limitations.
- [ ] Screen recording or written walkthrough under 3 minutes.
- [ ] Walkthrough shows adding a competitor.
- [ ] Walkthrough shows detecting a change.
- [ ] Walkthrough shows receiving an intelligence card in the CRM.

## Testing Checklist

### 1. Scraper Tests

- [ ] Static site scrape works for `https://example.com`.
- [ ] HTML fetched.
- [ ] Text extracted.
- [ ] Stored in database.
- [ ] JavaScript site scrape works for `https://openai.com`.
- [ ] Dynamic content loaded.
- [ ] Text extracted.
- [ ] Second scrape comparison works.
- [ ] Previous version exists.
- [ ] Current version exists.

### 2. Semantic Change Detection Tests

- [ ] `Price: $100` to `Current Price: $100` is ignored as not meaningful.
- [ ] `Price: $100` to `Price: $70` is flagged as meaningful.
- [ ] Cookie banner update is ignored.
- [ ] `We sell AI tools.` to `We now provide AI Agents.` is detected as content shift.
- [ ] Careers page to `Hiring 20 AI Engineers` is detected as hiring signal.
- [ ] At least 5 real URLs tested across different change types.

### 3. Change Classification Tests

- [ ] `We launched GPT Vision.` becomes Feature Update.
- [ ] `Now hiring ML Engineers.` becomes Hiring Signal.
- [ ] `Price reduced by 30%.` becomes Pricing Change.
- [ ] `CEO changed.` becomes Leadership Change.

### 4. Scheduler Tests

- [ ] Scheduler starts.
- [ ] Scheduler scrapes automatically.
- [ ] Scheduler saves data.

### 5. LLM Tests

- [ ] LLM returns summary.
- [ ] LLM returns impact score.
- [ ] LLM returns recommendation.
- [ ] LLM finishes under 90 seconds on Railway CPU.

### 6. CRM Tests

- [ ] Intelligence card creates CRM record.
- [ ] Re-running same change does not create duplicate.
- [ ] CRM failure is stored in retry queue.
- [ ] Retry succeeds on next run.

### 7. Email Tests

- [ ] Digest email is received.
- [ ] Digest grouped by competitor.
- [ ] Digest sorted by impact.
- [ ] Top 3 highlighted.
- [ ] No digest sent when there are no new changes.

### 8. Chrome Extension Tests

- [ ] Current page URL auto-fills.
- [ ] Clicking Add sends competitor to backend.
- [ ] Badge count increases when new intelligence exists.

### 9. UI Tests

- [ ] Dashboard shows competitor.
- [ ] Dashboard shows last checked.
- [ ] Dashboard shows status.
- [ ] Dashboard shows weekly changes.
- [ ] Feed shows summary.
- [ ] Feed shows impact.
- [ ] Feed shows category.
- [ ] Feed shows recommendation.
- [ ] Competitor page shows history.
- [ ] Competitor page shows chart.
- [ ] Competitor page shows settings.

### 10. Railway Deployment Tests

- [ ] Railway app URL loads.
- [ ] Add competitor works on deployed app.
- [ ] Scheduler runs on deployed app.
- [ ] New intelligence card is generated on deployed app.

### 11. README Tests

- [ ] Someone can clone using only the README.
- [ ] Someone can install using only the README.
- [ ] Someone can run using only the README.
- [ ] Someone can deploy using only the README.

## Final Pass Table

- [ ] Scrapes websites
- [ ] Handles JS pages
- [ ] Stores content
- [ ] Detects meaningful changes
- [ ] Ignores cosmetic changes
- [ ] Classifies change type
- [ ] LLM summary
- [ ] Impact score
- [ ] Recommendation
- [ ] Scheduler works
- [ ] Notion or Airtable sync
- [ ] No duplicate CRM records
- [ ] Retry failed CRM writes
- [ ] Email digest
- [ ] Chrome extension
- [ ] Badge count
- [ ] Dashboard
- [ ] Intelligence feed
- [ ] Railway deployment
- [ ] README

# Requirements Checklist

Use this as the final no-skip checklist for **Autonomous Competitor Intelligence Engine**.

## Project Identity

- [ ] Project name is exactly `Autonomous Competitor Intelligence Engine`
- [ ] Project name is used consistently in README
- [ ] Project name is used consistently in app title
- [ ] Project name is used consistently in UI heading
- [ ] Project name is used consistently in submission materials

## Overview

- [ ] Build a web app plus Chrome extension
- [ ] Track price changes
- [ ] Track feature launches
- [ ] Track job postings
- [ ] Track blog content
- [ ] Track leadership changes
- [ ] Monitor configurable competitor URLs on a schedule
- [ ] Detect meaningful changes semantically
- [ ] Do not rely on string diffing as the core detector
- [ ] Score impact with a local CPU-bound LLM
- [ ] Push intelligence cards to Notion or Airtable
- [ ] Send digest emails on a configurable schedule
- [ ] Allow one-click page addition from Chrome extension
- [ ] Keep UI understandable without README help

## Scraping Pipeline

- [ ] Scheduled scraping pipeline exists
- [ ] Scrape interval is configurable
- [ ] Railway-safe minimum interval is every 6 hours
- [ ] Static HTML pages are supported
- [ ] JavaScript-rendered pages are supported
- [ ] Lightweight headless approach is used
- [ ] Approach fits Railway memory limits
- [ ] Basic bot-detection handling exists
- [ ] User-agent checks are handled
- [ ] Simple rate limiting is handled
- [ ] Previous content is stored
- [ ] Current content is stored

## Semantic Change Detection

- [ ] Previous content is embedded
- [ ] Current content is embedded
- [ ] Similarity or semantic distance is computed
- [ ] Threshold is configurable
- [ ] Only meaningful changes are flagged
- [ ] Cookie banner changes are filtered
- [ ] Footer updates are filtered
- [ ] Ad rotation is filtered
- [ ] Navigational changes are filtered
- [ ] `Price: $100` to `Current Price: $100` is ignored
- [ ] `Price: $100` to `Price: $70` is detected as meaningful
- [ ] `We sell AI tools.` to `We now provide AI Agents.` is treated as content shift
- [ ] `Careers` to `Hiring 20 AI Engineers` is treated as hiring signal

## Change Classification

- [ ] Classification is model-based
- [ ] Pricing change category exists
- [ ] Product or feature update category exists
- [ ] Hiring signal category exists
- [ ] Content or messaging shift category exists
- [ ] Leadership or company change category exists
- [ ] Other category exists

## Local LLM Impact Scoring

- [ ] Local LLM is used
- [ ] Inference is CPU-bound
- [ ] Fits Railway memory envelope
- [ ] One-paragraph summary is produced
- [ ] Why-it-matters explanation is produced
- [ ] Impact score from 1 to 10 is produced
- [ ] Brief impact justification is produced
- [ ] Recommended action is produced
- [ ] Onboarding collects what the product does
- [ ] Onboarding collects who the customers are
- [ ] Onboarding collects price point
- [ ] Impact scoring is relative to business profile
- [ ] Inference stays under 90 seconds per change
- [ ] README documents model name
- [ ] README documents model size
- [ ] README documents average inference time
- [ ] README documents RAM usage

## Intelligence Cards

- [ ] Competitor name is stored
- [ ] URL is stored
- [ ] Change category is stored
- [ ] Summary is stored
- [ ] Impact score is stored
- [ ] Justification is stored
- [ ] Recommended action is stored
- [ ] Timestamp is stored
- [ ] Screenshot or archived version link is stored
- [ ] CRM sync status is visible

## CRM Integration

- [ ] Uses Notion or Airtable
- [ ] Sync is idempotent
- [ ] Duplicate records are prevented
- [ ] Failed writes are queued locally
- [ ] Failed writes retry on next run
- [ ] Failed sync state is visible in web UI
- [ ] Failed writes are never silently dropped

## Digest Email

- [ ] Digest schedule is configurable
- [ ] Daily option exists
- [ ] Weekly option exists
- [ ] Includes all cards since last digest
- [ ] Grouped by competitor
- [ ] Sorted by impact score descending
- [ ] Top 3 highest-impact changes are highlighted
- [ ] Uses free SMTP option
- [ ] No digest sent when there are no new changes

## Chrome Extension

- [ ] Chrome extension exists
- [ ] Current tab URL auto-fills
- [ ] Popup has competitor label field
- [ ] Popup has scope selector
- [ ] Full page scope exists
- [ ] Pricing section only scope exists
- [ ] Careers section only scope exists
- [ ] Add action sends data to Railway backend
- [ ] Popup shows success state
- [ ] Popup shows failure state
- [ ] No login required
- [ ] API key can be pasted in settings
- [ ] API key is stored and used by extension
- [ ] Unread badge count appears
- [ ] Badge updates while browser is open
- [ ] Extension loads in one step for evaluator

## Web UI

- [ ] Dashboard exists
- [ ] Dashboard shows competitor cards
- [ ] Dashboard shows competitor name
- [ ] Dashboard shows last checked time
- [ ] Dashboard shows weekly changes
- [ ] Dashboard shows active status
- [ ] Dashboard shows paused status
- [ ] Dashboard shows error status
- [ ] Intelligence feed exists
- [ ] Feed is reverse chronological
- [ ] Feed filters by competitor
- [ ] Feed filters by category
- [ ] Feed card shows summary
- [ ] Feed card shows colour-coded impact badge
- [ ] Feed card shows recommended action
- [ ] Feed card links to archive or diff
- [ ] Competitor detail page exists
- [ ] Competitor detail page shows full history
- [ ] Competitor detail page shows impact chart
- [ ] Competitor detail page shows monitoring controls
- [ ] Onboarding flow exists
- [ ] Onboarding provides field-level guidance
- [ ] Settings page exists
- [ ] Settings page supports digest email configuration
- [ ] Settings page supports API key management
- [ ] UI is clean
- [ ] UI is labelled
- [ ] UI is understandable without instructions

## Reliability and Error Handling

- [ ] Scrape failure state is handled
- [ ] Timeout state is handled
- [ ] Unsupported page state is handled
- [ ] CRM sync failure state is handled
- [ ] Email failure state is handled
- [ ] Extension API failure state is handled
- [ ] Invalid API key state is handled
- [ ] Empty state is handled
- [ ] Loading state is handled

## Constraints

- [ ] Entire system runs on Railway free tier
- [ ] All services fit Railway free tier
- [ ] Scheduler fits Railway free tier
- [ ] Database fits Railway free tier
- [ ] Background work fits Railway free tier
- [ ] No paid APIs are used
- [ ] No paid proxy service is used
- [ ] All ML inference is CPU-bound
- [ ] Public GitHub repository is used
- [ ] Railway URL is live at submission time

## Reduced Scope Rule

- [ ] Only 2 enrichment sources per competitor are supported
- [ ] Only Notion or Airtable is implemented, not both

## Day-by-Day Timeline

- [ ] Day 1 scaffold complete
- [ ] Day 1 database schema complete
- [ ] Day 1 basic scraper works
- [ ] Day 1 single URL scrape works
- [ ] Day 1 content storage works
- [ ] Day 1 second scrape diff works
- [ ] Day 1 API add and retrieval works
- [ ] Day 2 semantic detection works
- [ ] Day 2 model-based classifier works
- [ ] Day 2 at least 5 URLs tested
- [ ] Day 2 scheduler works
- [ ] Day 3 LLM scoring integrated
- [ ] Day 3 output quality acceptable
- [ ] Day 3 CRM sync works
- [ ] Day 3 idempotency works
- [ ] Day 3 retry logic works
- [ ] Day 3 intelligence cards visible in UI
- [ ] Day 4 digest email works
- [ ] Day 4 digest formatting correct
- [ ] Day 4 extension built
- [ ] Day 4 extension connected to backend
- [ ] Day 4 badge count updates correctly
- [ ] Day 5 full UI polish complete
- [ ] Day 5 error handling complete
- [ ] Day 5 README complete
- [ ] Day 5 Railway deployment stable
- [ ] Day 5 stranger can use app without guidance

## Bonus Tasks

- [ ] Screenshot archiving implemented
- [ ] Slack webhook for score 8+ implemented
- [ ] Competitor relationship graph implemented
- [ ] RSS or blog monitoring implemented

## Testing

### Scraper Tests

- [ ] `https://example.com` static scrape works
- [ ] HTML fetched
- [ ] Text extracted
- [ ] Stored in database
- [ ] `https://openai.com` JavaScript scrape works
- [ ] Dynamic content loaded
- [ ] Text extracted
- [ ] Second scrape comparison works
- [ ] Previous version exists
- [ ] Current version exists

### Semantic Change Detection Tests

- [ ] Same-price wording change is ignored
- [ ] Price drop is detected
- [ ] Cookie banner change is ignored
- [ ] Messaging shift is detected
- [ ] Hiring signal is detected
- [ ] At least 5 real URLs tested

### Change Classification Tests

- [ ] `We launched GPT Vision.` -> Feature Update
- [ ] `Now hiring ML Engineers.` -> Hiring Signal
- [ ] `Price reduced by 30%.` -> Pricing Change
- [ ] `CEO changed.` -> Leadership Change

### Scheduler Tests

- [ ] Scheduler starts
- [ ] Scheduler scrapes automatically
- [ ] Scheduler saves data

### LLM Tests

- [ ] LLM returns summary
- [ ] LLM returns impact score
- [ ] LLM returns recommendation
- [ ] LLM stays under 90 seconds on Railway CPU

### CRM Tests

- [ ] Intelligence card creates CRM record
- [ ] Re-processing same change creates no duplicate
- [ ] Failed write enters retry queue
- [ ] Retry succeeds on later run

### Email Tests

- [ ] Digest email received
- [ ] Digest grouped by competitor
- [ ] Digest sorted by impact
- [ ] Top 3 highlighted
- [ ] No email when no changes

### Chrome Extension Tests

- [ ] Current URL auto-fills
- [ ] Add action sends competitor to backend
- [ ] Badge count increases for new unread intelligence

### UI Tests

- [ ] Dashboard shows competitor
- [ ] Dashboard shows last checked
- [ ] Dashboard shows status
- [ ] Dashboard shows weekly changes
- [ ] Feed shows summary
- [ ] Feed shows impact
- [ ] Feed shows category
- [ ] Feed shows recommendation
- [ ] Competitor page shows history
- [ ] Competitor page shows chart
- [ ] Competitor page shows settings

### Railway Deployment Tests

- [ ] Deployed Railway URL loads
- [ ] Add competitor works on deployed app
- [ ] Scheduler runs on deployed app
- [ ] New intelligence card is generated on deployed app

### README Tests

- [ ] Someone can clone using only the README
- [ ] Someone can install using only the README
- [ ] Someone can run using only the README
- [ ] Someone can deploy using only the README

## Final Evaluation Checklist

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

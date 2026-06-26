# Final Audit Prompt

Use this after the project is generated.

Project name must remain exactly:

**Autonomous Competitor Intelligence Engine**

Perform a strict final audit of the entire project and do not skip any required assignment point.

Your task:

1. Compare the current implementation against every mandatory requirement of the assignment.
2. Find every missing feature, weak implementation, unclear UI flow, incomplete test path, deployment gap, or documentation gap.
3. Fix all mandatory missing items.
4. Improve any area that would cause an evaluator to mark the project incomplete.

## Audit Areas

Audit all of these:

- project naming consistency
- Railway free tier compatibility
- scraping support
- JavaScript page handling
- semantic change detection quality
- cosmetic change filtering
- model-based classification
- local CPU-bound LLM impact scoring
- inference performance under 90 seconds
- onboarding business profile collection
- intelligence card completeness
- Notion or Airtable sync
- idempotency
- retry queue
- digest email behavior
- Chrome extension behavior
- extension badge count
- dashboard completeness
- intelligence feed completeness
- competitor detail page completeness
- settings page completeness
- error handling
- README completeness
- deployment readiness
- evaluator friendliness

## Mandatory Review Questions

Confirm all of the following:

- Can a stranger use the deployed app without guidance?
- Can a competitor be added from the web app?
- Can a competitor be added from the Chrome extension?
- Are meaningful changes detected semantically?
- Are cosmetic changes ignored?
- Is classification model-based?
- Is impact scoring relative to business context?
- Are intelligence cards structured correctly?
- Is CRM sync idempotent?
- Are failed CRM writes queued and retried?
- Is digest email grouped by competitor and sorted by impact?
- Is top 3 highlighting present?
- Is no-change digest suppression implemented?
- Does the extension avoid login and use an API key?
- Does the extension badge update?
- Is the UI clean and labelled?
- Does the README allow clone, install, run, and deploy?

## Required Final Output

At the end of the audit, provide:

- a list of fixes made
- a list of any unavoidable limitations
- confirmation that all mandatory points were checked
- explicit note if anything remains incomplete

Do not say the project is done unless every mandatory requirement has been checked carefully.

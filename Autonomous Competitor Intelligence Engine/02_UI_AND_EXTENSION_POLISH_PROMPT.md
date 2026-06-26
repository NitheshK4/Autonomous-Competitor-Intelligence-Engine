# UI and Extension Polish Prompt

Use this after the main build if the first version needs improvement.

Project name must remain exactly:

**Autonomous Competitor Intelligence Engine**

Improve the project with a strong focus on:

- UI clarity
- visual polish
- extension quality
- onboarding quality
- evaluator friendliness
- non-technical usability

Do not remove any existing required functionality.

## UI Upgrade Goals

Make the app feel like a serious product demo, not a rough internal tool.

The interface must be:

- clean
- clearly labelled
- intuitive
- easy to scan
- usable without README guidance

## Required UI Improvements

### Dashboard

Improve the dashboard so each competitor card clearly shows:

- competitor name
- last checked time
- number of changes this week
- monitoring status

Add:

- strong visual hierarchy
- readable status styling
- useful empty state when no competitors exist
- loading states
- error states

### Intelligence Feed

Improve the feed so it is easy to scan quickly.

Every card should clearly show:

- summary
- impact score badge
- category
- recommendation
- timestamp
- competitor name
- archived page link or diff link

Improve:

- filter controls
- spacing
- typography
- badge color logic
- mobile responsiveness

### Competitor Detail Page

Improve this page so it feels complete and evaluator-ready.

Must clearly show:

- change history
- impact score trend chart
- monitoring settings
- last run result
- CRM sync status for related intelligence cards

### Onboarding

Improve onboarding so a first-time user knows exactly what to enter.

Add:

- field-level helper text
- examples
- validation
- smooth step flow

Business profile fields should clearly explain:

- what the user’s product does
- who their customers are
- price point
- why this information is needed for impact scoring

### Settings

Improve settings page clarity for:

- digest email configuration
- CRM/API key setup
- extension API key usage instructions

### Error Handling

Make error messages human-readable and useful.

Cover:

- scrape failure
- sync failure
- email failure
- extension add failure
- invalid API key
- missing onboarding data

## Chrome Extension Improvements

Improve the Chrome extension so it feels polished and reliable.

Requirements:

- popup should look clean and trustworthy
- current page URL should auto-fill correctly
- label field should be easy to use
- scope selector should be obvious
- Add action should clearly show loading, success, or failure
- settings page for API key should be simple and clear
- badge count should be visually correct and update reliably

Packaging and evaluator experience:

- make extension ready for Chrome developer mode loading with no extra build step
- keep files easy to inspect
- include clear instructions in README

## Final Rule

Do a final pass specifically checking whether a non-technical evaluator could:

- understand the product purpose
- add a competitor
- browse intelligence cards
- understand sync status
- trust the extension
- use the app without confusion

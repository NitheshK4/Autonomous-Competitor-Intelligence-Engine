const db = require('/Users/nitheshkumar/Documents/acie/server/src/db');
const { runScrape } = require('/Users/nitheshkumar/Documents/acie/server/src/scraper');
const { detectChanges } = require('/Users/nitheshkumar/Documents/acie/server/src/detector');
const { analyzeChange } = require('/Users/nitheshkumar/Documents/acie/server/src/llm');

async function test() {
  console.log('Fetching competitor 7...');
  const competitor = await db.getCompetitorById(7);
  console.log('Competitor:', competitor);

  try {
    console.log('Scraping...');
    const scrapeResult = await runScrape(competitor);
    console.log('Scraped text length:', scrapeResult.textContent.length);
    console.log('Scraped text preview:', scrapeResult.textContent.substring(0, 500));

    console.log('Fetching history...');
    const scrapes = await db.getScrapeHistory(7);
    const previousScrape = scrapes[0] || null;
    const oldText = previousScrape ? previousScrape.text_content : '';
    console.log('Previous scrape text length:', oldText.length);

    console.log('Detecting changes...');
    const thresholdSetting = await db.getSetting('semantic_threshold') || '0.85';
    const threshold = parseFloat(thresholdSetting);
    const detection = await detectChanges(oldText, scrapeResult.textContent, threshold);
    console.log('Detection results:', {
      hasChanged: detection.hasChanged,
      similarity: detection.similarity,
      diffTextLength: detection.diffText ? detection.diffText.length : 0
    });

    if (detection.hasChanged) {
      console.log('Diff Text Preview:', detection.diffText.substring(0, 500));
      const profile = await db.getProfile();
      console.log('Profile:', profile);

      console.log('Analyzing change with LLM...');
      const analysis = await analyzeChange(detection.diffText, profile);
      console.log('Analysis result:', analysis);
    }
  } catch (err) {
    console.error('Pipeline failed:', err);
  }
}

test().then(() => process.exit(0));

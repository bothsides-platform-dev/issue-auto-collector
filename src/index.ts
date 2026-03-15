import { parseArgs } from 'node:util';
import { join } from 'node:path';
import { DcinsideScraper } from './scrapers/dcinside.js';
import { FmkoreaScraper } from './scrapers/fmkorea.js';
import { PpomppuScraper } from './scrapers/ppomppu.js';
import { RuliwebScraper } from './scrapers/ruliweb.js';
import { TheqooScraper } from './scrapers/theqoo.js';
import { InstizScraper } from './scrapers/instiz.js';
import { NavercafeScraper } from './scrapers/navercafe.js';
import { JsonStore } from './storage/json-store.js';
import { MarkdownStore } from './storage/markdown-store.js';
import { Deduplicator } from './storage/deduplicator.js';
import { logger } from './utils/logger.js';
import { BaseScraper } from './scrapers/base.js';
import type { SiteName, ScraperResult, CollectionResult } from './types.js';

const ALL_SCRAPERS: Record<SiteName, () => BaseScraper> = {
  dcinside: () => new DcinsideScraper(),
  fmkorea: () => new FmkoreaScraper(),
  ppomppu: () => new PpomppuScraper(),
  ruliweb: () => new RuliwebScraper(),
  theqoo: () => new TheqooScraper(),
  instiz: () => new InstizScraper(),
  navercafe: () => new NavercafeScraper(),
};

async function main() {
  const { values } = parseArgs({
    options: {
      'output-dir': { type: 'string', default: join(process.cwd(), 'data') },
      site: { type: 'string' },
    },
    strict: false,
  });

  const outputDir = values['output-dir'] as string;
  const siteFilter = values.site as string | undefined;

  const sitesToScrape: SiteName[] = siteFilter
    ? [siteFilter as SiteName]
    : (Object.keys(ALL_SCRAPERS) as SiteName[]);

  logger.info(`Starting collection for: ${sitesToScrape.join(', ')}`);
  logger.info(`Output directory: ${outputDir}`);

  const deduplicator = new Deduplicator(outputDir);
  await deduplicator.load();

  const collectedAt = new Date().toISOString();
  const results: ScraperResult[] = [];

  for (const siteName of sitesToScrape) {
    const scraperFactory = ALL_SCRAPERS[siteName];
    if (!scraperFactory) {
      logger.warn(`Unknown site: ${siteName}, skipping`);
      continue;
    }

    logger.info(`--- Scraping ${siteName} ---`);
    const scraper = scraperFactory();

    try {
      const posts = await scraper.scrape(deduplicator);
      results.push({
        site: siteName,
        posts,
        collectedAt,
      });
      logger.info(`[${siteName}] Success: ${posts.length} posts`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[${siteName}] Failed: ${errorMsg}`);
      results.push({
        site: siteName,
        posts: [],
        error: errorMsg,
        collectedAt,
      });
    }
  }

  const totalPosts = results.reduce((sum, r) => sum + r.posts.length, 0);
  const collectionResult: CollectionResult = {
    collectedAt,
    results,
    totalPosts,
  };

  const store = new JsonStore(outputDir);
  const filePath = await store.save(collectionResult);

  const mdStore = new MarkdownStore(outputDir);
  const mdFilePath = await mdStore.save(collectionResult);

  await deduplicator.save();

  logger.info(`=== Collection complete ===`);
  logger.info(`Total posts: ${totalPosts}`);
  logger.info(`Saved to: ${filePath}`);
  logger.info(`Markdown: ${mdFilePath}`);

  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : `${r.posts.length} posts`;
    logger.info(`  ${r.site}: ${status}`);
  }
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

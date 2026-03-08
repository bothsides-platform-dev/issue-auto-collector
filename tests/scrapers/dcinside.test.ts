import { describe, it, expect } from 'vitest';
import { DcinsideScraper } from '../../src/scrapers/dcinside.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

const fixturesDir = join(import.meta.dirname, '../fixtures');

describe('DcinsideScraper', () => {
  const scraper = new DcinsideScraper();

  describe('parseListPage', () => {
    it('should parse list page HTML', () => {
      const html = readFileSync(join(fixturesDir, 'dcinside-list.html'), 'utf-8');
      const $ = load(html);
      const items = scraper.parseListPage($ as any, 'https://gall.dcinside.com/board/lists/?id=dcbest');

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.title).toBeTruthy();
        expect(item.url).toMatch(/^https:\/\/gall\.dcinside\.com/);
      }
    });
  });

  describe('parseDetailPage', () => {
    it('should parse detail page HTML', () => {
      const html = readFileSync(join(fixturesDir, 'dcinside-detail.html'), 'utf-8');
      const $ = load(html);
      const detail = scraper.parseDetailPage($ as any, 'https://gall.dcinside.com/board/view/?id=dcbest&no=1');

      expect(detail.content).toBeTruthy();
    });
  });
});

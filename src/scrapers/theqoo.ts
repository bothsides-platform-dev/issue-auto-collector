import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, normalizeUrl, parseNumber } from '../utils/sanitizer.js';

export class TheqooScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.theqoo);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('table.theqoo_board_table tbody tr').each((_, el) => {
      const $row = $(el);
      // Skip notice rows
      if ($row.hasClass('notice') || $row.hasClass('notice_expand')) return;

      const $titleLink = $row.find('td.title > a:first-child');
      const href = $titleLink.attr('href');
      if (!href) return;

      const title = $titleLink.text().trim();
      if (!title) return;

      const category = $row.find('td.cate span').text().trim();
      const commentText = $row.find('td.title a.replyNum').text().trim();

      items.push({
        title,
        url: normalizeUrl(href, this.config.baseUrl),
        category: category || undefined,
        viewCount: parseNumber($row.find('td.m_no').text()),
        commentCount: parseNumber(commentText),
      });
    });

    return items;
  }

  parseDetailPage($: $, url: string): PostDetail {
    const $content = $('.xe_content').first();
    const imageUrls: string[] = [];

    $content.find('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        imageUrls.push(src.startsWith('//') ? `https:${src}` : src);
      }
    });

    return {
      content: sanitizeText($content.html() || ''),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
  }
}

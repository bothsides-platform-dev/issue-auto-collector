import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, normalizeUrl, parseNumber } from '../utils/sanitizer.js';

export class PpomppuScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.ppomppu);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('table.board_table tr[class*="baseList"]').each((_, el) => {
      const $row = $(el);
      const $titleLinks = $row.find('td.title a.baseList-title');
      // Second a.baseList-title has the actual title
      const $titleLink = $titleLinks.length > 1 ? $titleLinks.eq(1) : $titleLinks.eq(0);
      const href = $titleLink.attr('href');
      if (!href) return;

      const title = $titleLink.text().trim();
      if (!title) return;

      const commentText = $row.find('span.list_comment2').text().trim();
      const category = $row.find('td.baseList-numb a').text().trim();
      const author = $row.find('.list_name').text().trim();

      // 6th td has recommendation (format: "N - M"), 7th has views
      const tds = $row.find('td');
      const viewCount = parseNumber(tds.eq(6).text());
      const recText = tds.eq(5).text().trim();
      const likeCount = parseNumber(recText.split('-')[0]);

      items.push({
        title,
        url: normalizeUrl(href, this.config.baseUrl),
        category: category || undefined,
        author: author || undefined,
        viewCount,
        commentCount: parseNumber(commentText),
        likeCount,
      });
    });

    return items;
  }

  parseDetailPage($: $, url: string): PostDetail {
    const $content = $('td.board-contents').first();
    const imageUrls: string[] = [];

    $content.find('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        imageUrls.push(normalizeUrl(src, this.config.baseUrl));
      }
    });

    return {
      content: sanitizeText($content.html() || ''),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
  }
}

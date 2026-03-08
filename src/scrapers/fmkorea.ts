import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, normalizeUrl, parseNumber } from '../utils/sanitizer.js';

export class FmkoreaScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.fmkorea);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('.fm_best_widget ul > li').each((_, el) => {
      const $item = $(el);
      const $titleLink = $item.find('h3.title > a');
      const href = $titleLink.attr('href');
      if (!href) return;

      const title = $item.find('h3.title span.ellipsis-target').text().trim()
        || $item.find('h3.title').attr('data-original-title')?.trim()
        || '';
      if (!title) return;

      const commentText = $item.find('span.comment_count').text().replace(/[\[\]]/g, '').trim();
      const author = $item.find('span.author').text().replace(/^[\s/]+/, '').trim();
      const category = $item.find('span.category > a:first-child').text().trim();
      const likeCount = parseNumber($item.find('a.pc_voted_count span.count').text());

      items.push({
        title,
        url: normalizeUrl(href, this.config.baseUrl),
        category: category || undefined,
        author: author || undefined,
        commentCount: parseNumber(commentText),
        likeCount,
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

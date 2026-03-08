import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, parseNumber } from '../utils/sanitizer.js';

export class InstizScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.instiz);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('#boardhot .realchart_item').each((_, el) => {
      const $item = $(el);
      const $link = $item.find('a');
      const href = $link.attr('href');
      if (!href) return;

      const title = $item.find('.post_title').text().trim();
      if (!title) return;

      const category = $item.find('.minitext').text().trim();
      const commentText = $item.find('.cmt').text().trim();

      items.push({
        title,
        url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
        category: category || undefined,
        commentCount: parseNumber(commentText),
      });
    });

    return items;
  }

  parseDetailPage($: $, url: string): PostDetail {
    // Instiz uses different content selectors depending on the board
    const $content = $('.memo_content, .memo_text, .xe_content').first();
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

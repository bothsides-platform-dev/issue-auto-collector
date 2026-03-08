import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, normalizeUrl, parseNumber } from '../utils/sanitizer.js';

export class RuliwebScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.ruliweb);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('table.board_list_table tr.table_body').each((_, el) => {
      const $row = $(el);
      const $link = $row.find('td.subject a.subject_link');
      const href = $link.attr('href');
      if (!href) return;

      // Title: get text from strong.text_over or span.text_over
      const title = $row.find('td.subject strong.text_over, td.subject span.text_over').first().text().trim();
      if (!title) return;

      const commentText = $row.find('span.num_reply').text().replace(/[()]/g, '').trim();
      const author = $row.find('td.writer').text().trim();

      items.push({
        title,
        url: normalizeUrl(href, this.config.baseUrl),
        author: author || undefined,
        viewCount: parseNumber($row.find('td.hit').text()),
        commentCount: parseNumber(commentText),
        likeCount: parseNumber($row.find('td.recomd').text()),
      });
    });

    return items;
  }

  parseDetailPage($: $, url: string): PostDetail {
    const $content = $('.view_content').first();
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

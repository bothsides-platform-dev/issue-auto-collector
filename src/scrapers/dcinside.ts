import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import { PostListItem, PostDetail } from '../types.js';
type $ = CheerioCrawlingContext['$'];
import { sanitizeText, normalizeUrl, parseNumber } from '../utils/sanitizer.js';

export class DcinsideScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.dcinside);
  }

  parseListPage($: $, url: string): PostListItem[] {
    const items: PostListItem[] = [];

    $('tr.ub-content.us-post').each((_, el) => {
      const $row = $(el);
      const $titleLink = $row.find('td.gall_tit a:first-child');
      const href = $titleLink.attr('href');
      if (!href) return;

      const category = $row.find('td.gall_tit a:first-child strong').text().trim();
      const fullTitle = $titleLink.text().trim();
      const title = category ? fullTitle.replace(category, '').trim() : fullTitle;

      const commentText = $row.find('.reply_num').text().replace(/[\[\]]/g, '').trim();
      const dateTitle = $row.find('td.gall_date').attr('title') || '';

      items.push({
        title,
        url: normalizeUrl(href, this.config.baseUrl),
        category: category.replace(/[\[\]]/g, '').trim() || undefined,
        author: $row.find('td.gall_writer').attr('data-nick') || undefined,
        viewCount: parseNumber($row.find('td.gall_count').text()),
        commentCount: parseNumber(commentText),
        likeCount: parseNumber($row.find('td.gall_recommend').text()),
        createdAt: dateTitle || undefined,
      });
    });

    return items;
  }

  parseDetailPage($: $, url: string): PostDetail {
    const $content = $('.write_div');
    const imageUrls: string[] = [];

    $content.find('img').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('dccon')) {
        imageUrls.push(src.startsWith('//') ? `https:${src}` : src);
      }
    });

    return {
      content: sanitizeText($content.html() || ''),
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
  }
}

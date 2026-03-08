import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import type { CheerioCrawlingContext } from 'crawlee';
import { BaseScraper } from './base.js';
import { SITE_CONFIGS } from '../config.js';
import type { PostListItem, PostDetail, TrendingPost } from '../types.js';
import { Deduplicator } from '../storage/deduplicator.js';
import { logger } from '../utils/logger.js';
import { sanitizeText } from '../utils/sanitizer.js';

const CLUB_ID = '31267980';
const LIST_API = `https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=${CLUB_ID}&search.queryType=lastArticle&search.page=1&search.perPage=20`;
const DETAIL_API_BASE = `https://apis.naver.com/cafe-web/cafe-articleapi/v2.1/cafes/${CLUB_ID}/articles`;

interface NaverArticle {
  articleId: number;
  subject: string;
  writerNickname?: string;
  menuName?: string;
  readCount?: number;
  commentCount?: number;
  likeItCount?: number;
  writeDateTimestamp?: number;
  openArticle?: boolean;
}

export class NavercafeScraper extends BaseScraper {
  constructor() {
    super(SITE_CONFIGS.navercafe);
  }

  parseListPage(_$: CheerioCrawlingContext['$'], _url: string): PostListItem[] {
    return [];
  }

  parseDetailPage(_$: CheerioCrawlingContext['$'], _url: string): PostDetail {
    return { content: '' };
  }

  override async scrape(deduplicator?: Deduplicator): Promise<TrendingPost[]> {
    const siteName = this.config.name;
    const collectedAt = new Date().toISOString();
    const delay = 60000 / this.config.maxRequestsPerMinute;
    const posts: TrendingPost[] = [];

    logger.info(`[${siteName}] Fetching article list from API`);
    const listRes = await fetch(LIST_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://cafe.naver.com/inissue',
      },
    });

    if (!listRes.ok) {
      throw new Error(`List API failed: ${listRes.status} ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    const articles: NaverArticle[] = listData?.message?.result?.articleList ?? [];
    const openArticles = articles.filter((a) => a.openArticle === true);

    logger.info(`[${siteName}] Found ${openArticles.length} open articles out of ${articles.length}`);

    for (const article of openArticles) {
      const articleUrl = `https://cafe.naver.com/inissue/${article.articleId}`;

      if (deduplicator?.isSeen(articleUrl)) {
        logger.info(`[${siteName}] Skipping already seen: ${article.subject}`);
        continue;
      }

      await new Promise((r) => setTimeout(r, delay));

      try {
        const detailRes = await fetch(`${DETAIL_API_BASE}/${article.articleId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': articleUrl,
          },
        });

        let content = '';
        let imageUrls: string[] | undefined;

        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const contentHtml: string = detailData?.result?.article?.contentHtml ?? '';

          if (contentHtml) {
            const $ = load(contentHtml);
            const imgs: string[] = [];
            $('img').each((_, el) => {
              const src = $(el).attr('src');
              if (src) {
                imgs.push(src.startsWith('//') ? `https:${src}` : src);
              }
            });
            if (imgs.length > 0) imageUrls = imgs;
            content = sanitizeText(contentHtml);
          }
        } else {
          logger.warn(`[${siteName}] Detail API failed for ${article.articleId}: ${detailRes.status}`);
        }

        const post: TrendingPost = {
          id: createHash('sha256').update(articleUrl).digest('hex'),
          title: article.subject,
          sourceUrl: articleUrl,
          sourceSite: siteName,
          category: article.menuName,
          author: article.writerNickname,
          viewCount: article.readCount,
          commentCount: article.commentCount,
          likeCount: article.likeItCount,
          createdAt: article.writeDateTimestamp
            ? new Date(article.writeDateTimestamp).toISOString()
            : undefined,
          collectedAt,
          content,
          imageUrls,
        };

        posts.push(post);
      } catch (e) {
        logger.error(`[${siteName}] Failed to fetch detail for ${article.articleId}`, e);
      }
    }

    if (deduplicator) {
      for (const post of posts) {
        deduplicator.markSeen(post.sourceUrl);
      }
    }

    logger.info(`[${siteName}] Collected ${posts.length} posts`);
    return posts;
  }
}

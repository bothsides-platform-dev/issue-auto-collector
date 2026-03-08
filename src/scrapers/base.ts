import { CheerioCrawler, type CheerioCrawlingContext, Configuration } from 'crawlee';
import { createHash } from 'node:crypto';
import {
  SiteConfig,
  TrendingPost,
  PostListItem,
  PostDetail,
} from '../types.js';
import { USER_AGENT, MAX_CONCURRENCY, MAX_RETRIES } from '../config.js';
import { Deduplicator } from '../storage/deduplicator.js';
import { logger } from '../utils/logger.js';

export abstract class BaseScraper {
  protected config: SiteConfig;
  protected posts: TrendingPost[] = [];

  constructor(config: SiteConfig) {
    this.config = config;
  }

  abstract parseListPage($: CheerioCrawlingContext['$'], url: string): PostListItem[];
  abstract parseDetailPage($: CheerioCrawlingContext['$'], url: string): PostDetail;

  async scrape(deduplicator?: Deduplicator): Promise<TrendingPost[]> {
    this.posts = [];
    const collectedAt = new Date().toISOString();
    const listItems: PostListItem[] = [];
    const self = this;
    const siteName = this.config.name;

    const crawlerConfig = new Configuration({ persistStorage: false });

    const crawler = new CheerioCrawler(
      {
        maxRequestsPerMinute: this.config.maxRequestsPerMinute,
        maxConcurrency: MAX_CONCURRENCY,
        maxRequestRetries: MAX_RETRIES,
        preNavigationHooks: [
          (_ctx, gotOptions) => {
            gotOptions.headers = {
              ...gotOptions.headers,
              'user-agent': USER_AGENT,
              'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
              'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            };
          },
        ],
        ignoreSslErrors: true,
        requestHandlerTimeoutSecs: 30,
        async requestHandler({ $, request }: CheerioCrawlingContext) {
          if (request.label === 'detail') {
            try {
              const detail = self.parseDetailPage($, request.url);
              const userData = request.userData as unknown as PostListItem;

              const post: TrendingPost = {
                id: createHash('sha256').update(request.url).digest('hex'),
                title: userData.title,
                sourceUrl: request.url,
                sourceSite: siteName,
                category: userData.category,
                author: userData.author,
                viewCount: userData.viewCount,
                commentCount: userData.commentCount,
                likeCount: userData.likeCount,
                createdAt: userData.createdAt,
                collectedAt,
                content: detail.content,
                imageUrls: detail.imageUrls,
              };

              self.posts.push(post);
            } catch (e) {
              logger.error(`[${siteName}] Failed to parse detail: ${request.url}`, e);
            }
          } else {
            try {
              const items = self.parseListPage($, request.url);
              listItems.push(...items);
              logger.info(`[${siteName}] Found ${items.length} posts on list page`);

              const detailRequests = items
                .filter((item: PostListItem) => {
                  if (deduplicator?.isSeen(item.url)) {
                    logger.info(`[${siteName}] Skipping already seen: ${item.title}`);
                    return false;
                  }
                  return true;
                })
                .map((item: PostListItem) => ({
                  url: item.url,
                  label: 'detail' as const,
                  userData: { ...item },
                }));

              if (detailRequests.length > 0) {
                await crawler.addRequests(detailRequests);
              }
            } catch (e) {
              logger.error(`[${siteName}] Failed to parse list page`, e);
            }
          }
        },
        async failedRequestHandler({ request }, error) {
          logger.error(`[${siteName}] Request failed: ${request.url}`, error);
        },
      },
      crawlerConfig,
    );

    await crawler.run([{ url: this.config.listUrl, label: 'list' }]);

    if (deduplicator) {
      for (const post of this.posts) {
        deduplicator.markSeen(post.sourceUrl);
      }
    }

    logger.info(`[${siteName}] Collected ${this.posts.length} posts`);
    return this.posts;
  }
}

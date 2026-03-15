import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CollectionResult, TrendingPost, ScraperResult } from '../types.js';
import { logger } from '../utils/logger.js';

export class MarkdownStore {
  constructor(private outputDir: string) {}

  async save(result: CollectionResult): Promise<string> {
    const now = new Date(result.collectedAt);
    const dateDir = now.toISOString().slice(0, 10);
    const timeFile = `${String(now.getUTCHours()).padStart(2, '0')}-${String(now.getUTCMinutes()).padStart(2, '0')}.md`;

    const dir = join(this.outputDir, dateDir);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, timeFile);
    const markdown = this.formatCollection(result);

    await writeFile(filePath, markdown, 'utf-8');
    logger.info(`Saved markdown to ${filePath}`);

    const latestPath = join(this.outputDir, 'latest.md');
    await writeFile(latestPath, markdown, 'utf-8');
    logger.info(`Updated latest.md`);

    return filePath;
  }

  private formatCollection(result: CollectionResult): string {
    const now = new Date(result.collectedAt);
    const timestamp = `${now.toISOString().slice(0, 10)} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} (UTC)`;

    const lines: string[] = [
      '# 트렌딩 이슈 수집 결과',
      '',
      `- **수집 시각**: ${timestamp}`,
      `- **총 게시글 수**: ${this.formatNumber(result.totalPosts)}`,
      '',
      '---',
    ];

    for (const siteResult of result.results) {
      lines.push('');
      lines.push(...this.formatSiteResult(siteResult));
    }

    return lines.join('\n') + '\n';
  }

  private formatSiteResult(siteResult: ScraperResult): string[] {
    const lines: string[] = [];
    const siteName = this.getSiteDisplayName(siteResult.site);

    if (siteResult.error) {
      lines.push(`## ${siteName} (오류)`);
      lines.push('');
      lines.push(`> ${siteResult.error}`);
      lines.push('');
      lines.push('---');
      return lines;
    }

    lines.push(`## ${siteName} (${this.formatNumber(siteResult.posts.length)} posts)`);
    lines.push('');

    for (let i = 0; i < siteResult.posts.length; i++) {
      lines.push(...this.formatPost(siteResult.posts[i], i + 1));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines;
  }

  private formatPost(post: TrendingPost, index: number): string[] {
    const lines: string[] = [];

    lines.push(`### ${index}. ${post.title}`);
    lines.push('');

    if (post.category) {
      lines.push(`- **카테고리**: ${post.category}`);
    }
    if (post.author) {
      lines.push(`- **작성자**: ${post.author}`);
    }

    const stats: string[] = [];
    if (post.viewCount !== undefined) stats.push(`**조회수**: ${this.formatNumber(post.viewCount)}`);
    if (post.commentCount !== undefined) stats.push(`**댓글**: ${this.formatNumber(post.commentCount)}`);
    if (post.likeCount !== undefined) stats.push(`**좋아요**: ${this.formatNumber(post.likeCount)}`);
    if (stats.length > 0) {
      lines.push(`- ${stats.join(' | ')}`);
    }

    if (post.createdAt) {
      lines.push(`- **작성일**: ${post.createdAt}`);
    }

    lines.push(`- **원문**: [링크](${post.sourceUrl})`);

    if (post.content) {
      lines.push('');
      lines.push(`> ${this.truncateContent(post.content, 200)}`);
    }

    return lines;
  }

  private formatNumber(n: number): string {
    return n.toLocaleString('en-US');
  }

  private truncateContent(content: string, maxLength: number): string {
    const cleaned = content.replace(/\n/g, ' ').trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.slice(0, maxLength) + '...';
  }

  private getSiteDisplayName(site: string): string {
    const names: Record<string, string> = {
      dcinside: 'DCinside',
      fmkorea: 'FM Korea',
      ppomppu: 'Ppomppu',
      ruliweb: 'Ruliweb',
      theqoo: 'theqoo',
      instiz: 'Instiz',
      navercafe: 'Naver Cafe',
    };
    return names[site] || site;
  }
}

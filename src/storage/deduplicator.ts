import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { SEEN_POSTS_MAX } from '../config.js';
import { logger } from '../utils/logger.js';

export class Deduplicator {
  private seenHashes: Set<string> = new Set();
  private filePath: string;

  constructor(outputDir: string) {
    this.filePath = join(outputDir, 'seen-posts.json');
  }

  async load(): Promise<void> {
    try {
      const data = await readFile(this.filePath, 'utf-8');
      const hashes: string[] = JSON.parse(data);
      this.seenHashes = new Set(hashes);
      logger.info(`Loaded ${this.seenHashes.size} seen post hashes`);
    } catch {
      this.seenHashes = new Set();
      logger.info('No existing seen-posts.json, starting fresh');
    }
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const hashes = Array.from(this.seenHashes);
    await writeFile(this.filePath, JSON.stringify(hashes), 'utf-8');
    logger.info(`Saved ${hashes.length} seen post hashes`);
  }

  static hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  isSeen(url: string): boolean {
    return this.seenHashes.has(Deduplicator.hashUrl(url));
  }

  markSeen(url: string): void {
    const hash = Deduplicator.hashUrl(url);
    this.seenHashes.add(hash);

    if (this.seenHashes.size > SEEN_POSTS_MAX) {
      const arr = Array.from(this.seenHashes);
      const toRemove = arr.length - SEEN_POSTS_MAX;
      for (let i = 0; i < toRemove; i++) {
        this.seenHashes.delete(arr[i]);
      }
    }
  }
}

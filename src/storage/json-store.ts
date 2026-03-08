import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CollectionResult } from '../types.js';
import { logger } from '../utils/logger.js';

export class JsonStore {
  constructor(private outputDir: string) {}

  async save(result: CollectionResult): Promise<string> {
    const now = new Date(result.collectedAt);
    const dateDir = now.toISOString().slice(0, 10);
    const timeFile = `${String(now.getUTCHours()).padStart(2, '0')}-${String(now.getUTCMinutes()).padStart(2, '0')}.json`;

    const dir = join(this.outputDir, dateDir);
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, timeFile);
    const json = JSON.stringify(result, null, 2);

    await writeFile(filePath, json, 'utf-8');
    logger.info(`Saved collection to ${filePath}`);

    const latestPath = join(this.outputDir, 'latest.json');
    await writeFile(latestPath, json, 'utf-8');
    logger.info(`Updated latest.json`);

    return filePath;
  }
}

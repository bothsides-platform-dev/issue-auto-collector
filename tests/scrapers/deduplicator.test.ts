import { describe, it, expect, beforeEach } from 'vitest';
import { Deduplicator } from '../../src/storage/deduplicator.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Deduplicator', () => {
  let tempDir: string;
  let dedup: Deduplicator;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'dedup-test-'));
    dedup = new Deduplicator(tempDir);
    await dedup.load();
  });

  it('should mark URLs as seen', () => {
    expect(dedup.isSeen('https://example.com/1')).toBe(false);
    dedup.markSeen('https://example.com/1');
    expect(dedup.isSeen('https://example.com/1')).toBe(true);
  });

  it('should persist and reload', async () => {
    dedup.markSeen('https://example.com/1');
    await dedup.save();

    const dedup2 = new Deduplicator(tempDir);
    await dedup2.load();
    expect(dedup2.isSeen('https://example.com/1')).toBe(true);
  });

  it('should hash URLs consistently', () => {
    const hash1 = Deduplicator.hashUrl('https://example.com/1');
    const hash2 = Deduplicator.hashUrl('https://example.com/1');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex
  });
});

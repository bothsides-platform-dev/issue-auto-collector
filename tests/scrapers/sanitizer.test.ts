import { describe, it, expect } from 'vitest';
import { sanitizeText, normalizeUrl, parseNumber } from '../../src/utils/sanitizer.js';

describe('sanitizeText', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeText('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('should convert br tags to newlines', () => {
    expect(sanitizeText('Line1<br>Line2<br/>Line3')).toBe('Line1\nLine2\nLine3');
  });

  it('should decode HTML entities', () => {
    expect(sanitizeText('&amp; &lt; &gt; &quot; &#39;')).toBe('& < > " \'');
  });

  it('should collapse whitespace', () => {
    expect(sanitizeText('  hello   world  ')).toBe('hello world');
  });

  it('should collapse multiple newlines', () => {
    expect(sanitizeText('a\n\n\n\nb')).toBe('a\n\nb');
  });
});

describe('normalizeUrl', () => {
  it('should return absolute URLs as-is', () => {
    expect(normalizeUrl('https://example.com/path', 'https://base.com')).toBe('https://example.com/path');
  });

  it('should handle protocol-relative URLs', () => {
    expect(normalizeUrl('//example.com/path', 'https://base.com')).toBe('https://example.com/path');
  });

  it('should handle absolute paths', () => {
    expect(normalizeUrl('/path/to/page', 'https://base.com')).toBe('https://base.com/path/to/page');
  });

  it('should handle relative paths', () => {
    expect(normalizeUrl('path/to/page', 'https://base.com')).toBe('https://base.com/path/to/page');
  });
});

describe('parseNumber', () => {
  it('should parse plain numbers', () => {
    expect(parseNumber('123')).toBe(123);
  });

  it('should handle commas', () => {
    expect(parseNumber('1,234')).toBe(1234);
  });

  it('should return undefined for empty input', () => {
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber(undefined)).toBeUndefined();
    expect(parseNumber(null)).toBeUndefined();
  });

  it('should return undefined for non-numeric input', () => {
    expect(parseNumber('abc')).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const LOCALES_DIR = join(__dirname, '../locales');

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return getAllKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe('locale files', () => {
  it('all locale files contain every key from en.json', async () => {
    const files = await readdir(LOCALES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const enRaw = await readFile(join(LOCALES_DIR, 'en.json'), 'utf-8');
    const enKeys = getAllKeys(JSON.parse(enRaw));

    const otherFiles = jsonFiles.filter((f) => f !== 'en.json');
    expect(otherFiles.length).toBeGreaterThan(0);

    for (const file of otherFiles) {
      const raw = await readFile(join(LOCALES_DIR, file), 'utf-8');
      const keys = getAllKeys(JSON.parse(raw));
      const missing = enKeys.filter((k) => !keys.includes(k));
      expect(missing, `${file} is missing keys: ${missing.join(', ')}`).toHaveLength(0);
    }
  });
});

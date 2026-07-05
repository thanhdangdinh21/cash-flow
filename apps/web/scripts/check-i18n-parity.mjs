#!/usr/bin/env node

/* global process */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve paths relative to this script (apps/web/scripts -> root -> packages/i18n/src/locales)
const enPath = join(__dirname, '../../../packages/i18n/src/locales/en.json');
const viPath = join(__dirname, '../../../packages/i18n/src/locales/vi.json');

// Load locale files
const enData = JSON.parse(readFileSync(enPath, 'utf8'));
const viData = JSON.parse(readFileSync(viPath, 'utf8'));

// Extract all dotted key paths from an object
function extractDottedKeys(obj, prefix = '') {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested objects
      const nestedKeys = extractDottedKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      // Leaf value
      keys.add(fullKey);
    }
  }

  return keys;
}

// Get key sets
const enKeys = extractDottedKeys(enData);
const viKeys = extractDottedKeys(viData);

// Find mismatches
const missingInVi = new Set([...enKeys].filter(k => !viKeys.has(k)));
const missingInEn = new Set([...viKeys].filter(k => !enKeys.has(k)));

const hasErrors = missingInVi.size > 0 || missingInEn.size > 0;

// Print errors if any
if (hasErrors) {
  [...missingInVi].sort().forEach(key => {
    console.log(`vi.json missing: ${key}`);
  });
  [...missingInEn].sort().forEach(key => {
    console.log(`en.json missing: ${key}`);
  });
  process.exit(1);
}

// Success: no errors, exit 0
process.exit(0);

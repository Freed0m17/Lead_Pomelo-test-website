// Full-page screenshot of a URL, saved to ./temporary screenshots/screenshot-N[-label].png
// Usage: node screenshot.mjs <url> [label] [width]
//   width defaults to 1440; pass e.g. 390 for a mobile-width capture
import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [url, label, widthArg] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [width]');
  process.exit(1);
}
const width = Number(widthArg) || 1440;

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const OUT_DIR = join(ROOT, 'temporary screenshots');
await mkdir(OUT_DIR, { recursive: true });

// Next number = highest existing screenshot-N + 1, so files are never overwritten
const existing = await readdir(OUT_DIR);
const maxN = existing.reduce((max, name) => {
  const m = name.match(/^screenshot-(\d+)/);
  return m ? Math.max(max, Number(m[1])) : max;
}, 0);
const safeLabel = label ? '-' + label.replace(/[^a-z0-9_-]+/gi, '-') : '';
const outPath = join(OUT_DIR, `screenshot-${maxN + 1}${safeLabel}.png`);

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 3200)); // let entrance animations settle
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(outPath);
} finally {
  await browser.close();
}

import { chromium } from '@playwright/test';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve(process.argv[2] ?? 'research/tour-review-20261004');
const destination = path.resolve('research/tour-contact-sheets');
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
  for (const directory of await readdir(source)) {
    const files = (await readdir(path.join(source, directory)))
      .filter((file) => file.endsWith('.png'))
      .sort();
    const mobile = directory.endsWith('-mobile');
    for (let start = 0; start < files.length; start += 10) {
      const cards = await Promise.all(
        files.slice(start, start + 10).map(async (file) => {
          const data = await readFile(path.join(source, directory, file));
          return `<figure><figcaption>${file}</figcaption><img src="data:image/png;base64,${data.toString('base64')}" alt="${file}"></figure>`;
        }),
      );
      await page.setContent(
        `<html><head><style>body{margin:16px;font:16px Arial;background:#eee;color:#142e20}h1{font-size:20px}main{display:grid;grid-template-columns:repeat(5,300px);gap:12px}figure{margin:0;background:white;padding:4px}figcaption{height:38px;overflow-wrap:anywhere}img{display:block;width:292px;height:${mobile ? 600 : 220}px;object-fit:contain}</style></head><body><h1>${directory} · ${start + 1}–${Math.min(start + 10, files.length)} / ${files.length}</h1><main>${cards.join('')}</main></body></html>`,
      );
      await page.screenshot({
        path: path.join(destination, `${directory}-${Math.floor(start / 10) + 1}.png`),
        fullPage: true,
      });
    }
    console.log(`Contact sheets: ${directory}, ${files.length} screenshots`);
  }
} finally {
  await browser.close();
}

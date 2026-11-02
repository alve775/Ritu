import { it, vi } from 'vitest';
import fs from 'node:fs';
import { globalCrop } from '../src/domain/global-season';
import { resolvePlantPhotos } from '../src/lib/plant-photo-source';
const folder = 'research/global-audit-2026-11-01';
it('records actual upstream status and error codes for one failed image batch', async () => {
  const report = JSON.parse(fs.readFileSync(`${folder}/api-coverage-full.json`, 'utf8'));
  const rows = report.results
    .filter((r: { status: string }) => r.status === 'provider-error')
    .slice(0, 12);
  const calls: unknown[] = [];
  const native = globalThis.fetch;
  vi.stubGlobal(
    'fetch',
    async (input: Parameters<typeof fetch>[0], options: Parameters<typeof fetch>[1]) => {
      const response = await native(input, options);
      const u = new URL(String(input));
      let error: unknown;
      try {
        error = (await response.clone().json()).error;
      } catch {}
      calls.push({
        at: new Date().toISOString(),
        host: u.hostname,
        action: u.searchParams.get('action'),
        parameters: Object.fromEntries(u.searchParams),
        status: response.status,
        retryAfter: response.headers.get('retry-after'),
        error,
      });
      return response;
    },
  );
  let failure = '';
  try {
    await resolvePlantPhotos(rows.map((r: { id: string }) => globalCrop(r.id)!));
  } catch (error) {
    failure = String(error);
  } finally {
    vi.unstubAllGlobals();
  }
  fs.writeFileSync(
    `${folder}/upstream-diagnostic.json`,
    JSON.stringify(
      { at: new Date().toISOString(), ids: rows.map((r: { id: string }) => r.id), failure, calls },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ failure, calls: calls.length }));
}, 180000);

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Resize the supplied artwork without cropping or stretching it.
const source = new URL('../public/icon_logo.jpg', import.meta.url);
const output = new URL('../public/icons/', import.meta.url);
await mkdir(output, { recursive: true });
const originals = new Map();
for (const size of [32, 48, 180, 192, 512]) {
  const png = await sharp(fileURLToPath(source))
    .resize(size, size, { fit: 'contain', background: '#000000' })
    .png()
    .toBuffer();
  originals.set(size, png);
  await writeFile(new URL(`ritu-${size}.png`, output), png);
}

// A maskable icon needs padding to keep the entire artwork inside the safe circle.
const inset = await sharp(originals.get(512)).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 3, background: '#000000' } })
  .composite([{ input: inset, left: 76, top: 76 }])
  .png()
  .toFile(fileURLToPath(new URL('ritu-maskable-512.png', output)));

// ICO can contain PNG images; include both conventional desktop favicon sizes.
const sizes = [32, 48];
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const png = originals.get(size);
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
}
await writeFile(
  new URL('../public/favicon.ico', import.meta.url),
  Buffer.concat([header, ...sizes.map((size) => originals.get(size))]),
);

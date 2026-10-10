import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'RITU — Grow with the seasons',
    short_name: 'RITU',
    description: 'A crop-rotation planner for Bangladesh.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#18382b',
    icons: [
      { src: '/icons/ritu-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/ritu-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/ritu-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

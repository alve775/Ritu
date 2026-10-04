import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/500.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/600.css';
import './globals.css';
import { PlannerProvider } from '../components/planner-provider';
import { Shell } from '../components/shell';

export const metadata: Metadata = {
  title: 'Ritu — Grow with the seasons',
  description:
    'A thoughtful crop-rotation planner for Bangladesh. Explore three seasons with your farm, water access and household needs in mind. Illustrative concept preview.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32 48x48', type: 'image/x-icon' },
      { url: '/icons/ritu-48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/icons/ritu-180.png', sizes: '180x180', type: 'image/png' },
  },
  appleWebApp: { capable: true, title: 'RITU', statusBarStyle: 'default' },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PlannerProvider>
          <Shell>{children}</Shell>
        </PlannerProvider>
      </body>
    </html>
  );
}

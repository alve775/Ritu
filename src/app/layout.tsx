import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/geist/wght.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/600.css';
// Stylesheet order is cascade order: the layer list first, then each layer's file.
import './globals.css';
import '../styles/legacy.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/year-wheel.css';
import '../styles/pages/farm.css';
import '../styles/pages/crops.css';
import '../styles/pages/calendar.css';
import '../styles/pages/track.css';
import '../styles/pages/insights.css';
import '../styles/pages/tour.css';
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

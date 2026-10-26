import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Anek_Bangla, Hind_Siliguri } from 'next/font/google';
// Noto Sans Bengali stays only as the fallback named in the font tokens.
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/600.css';
// Stylesheet order is cascade order: the layer list first, then each layer's file.
import './globals.css';
import '../styles/tokens.css';
import '../styles/ritu-tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/season-ribbon.css';
import '../styles/year-wheel.css';
import '../styles/pages/farm.css';
import '../styles/pages/crops.css';
import '../styles/pages/calendar.css';
import '../styles/pages/track.css';
import '../styles/pages/insights.css';
import '../styles/pages/tour.css';
import '../styles/pages/live-farm.css';
import '../styles/pages/evidence.css';
import { PlannerProvider } from '../components/planner-provider';

const display = Anek_Bangla({
  subsets: ['bengali', 'latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});
const body = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Ritu — Grow with the seasons',
  description:
    'Plan crop rotations with dated NASA POWER history, current weather forecasts and official DAE regional crop calendars. Find your field, compare source-based sequences and keep actual planting records.',
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
export const viewport: Viewport = {
  colorScheme: 'light',
  // Mirrors --color-bg in src/styles/tokens.css (viewport metadata cannot read CSS variables).
  themeColor: '#ffffff',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <PlannerProvider>{children}</PlannerProvider>
      </body>
    </html>
  );
}

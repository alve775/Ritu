import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Anek_Bangla, Hind_Siliguri } from 'next/font/google';
// Bangla text uses Noto Sans Bengali. Only its Bengali subset is loaded, so English text
// keeps Hind Siliguri / Anek Bangla's Latin letters (see the font tokens).
import '@fontsource/noto-sans-bengali/bengali-400.css';
import '@fontsource/noto-sans-bengali/bengali-500.css';
import '@fontsource/noto-sans-bengali/bengali-600.css';
import '@fontsource/noto-sans-bengali/bengali-700.css';
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
import '../styles/pages/season-farms.css';
import '../styles/pages/plots.css';
import '../styles/pages/rotation.css';
import '../styles/pages/notes.css';
import { PlannerProvider } from '../components/planner-provider';

const display = Anek_Bangla({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});
const body = Hind_Siliguri({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Ritu — Grow with the seasons',
  description:
    'Manage farms worldwide, screen crops using NASA climate and published crop requirements, choose one crop per season, and follow a farm calendar with current weather forecasts and actual field records.',
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

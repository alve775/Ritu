import type { Metadata } from 'next';
import { SeasonDashboard } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 4 of 4 · Farm calendar — RITU' };
export default function Page() {
  return <SeasonDashboard />;
}

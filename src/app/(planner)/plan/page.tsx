import type { Metadata } from 'next';
import { SeasonDashboard } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 3 of 4: Your calendar — RITU' };
export default function Page() {
  return <SeasonDashboard />;
}

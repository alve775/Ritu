import type { Metadata } from 'next';
import { SeasonDashboard } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 4 of 4: Field records — RITU' };
export default function Page() {
  return <SeasonDashboard />;
}

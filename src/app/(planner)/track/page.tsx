import type { Metadata } from 'next';
import { SeasonDashboard } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Crop calendar — RITU' };
export default function Page() {
  return <SeasonDashboard />;
}

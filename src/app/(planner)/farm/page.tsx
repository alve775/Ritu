import type { Metadata } from 'next';
import { SeasonFarmView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Dashboard · Land — RITU' };
export default function Page() {
  return <SeasonFarmView />;
}

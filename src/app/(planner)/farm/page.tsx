import type { Metadata } from 'next';
import { SeasonFarmView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 1 of 4 · Dashboard · Land — RITU' };
export default function Page() {
  return <SeasonFarmView />;
}

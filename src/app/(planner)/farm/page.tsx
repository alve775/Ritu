import type { Metadata } from 'next';
import { SeasonFarmView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 2 of 4 · Land details — RITU' };
export default function Page() {
  return <SeasonFarmView />;
}

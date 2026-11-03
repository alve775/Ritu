import type { Metadata } from 'next';
import { SeasonCropsView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 3 of 4 · Suggested crops — RITU' };
export default function Page() {
  return <SeasonCropsView />;
}

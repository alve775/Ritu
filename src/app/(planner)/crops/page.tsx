import type { Metadata } from 'next';
import { SeasonCropsView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 2 of 4: Crop choices — RITU' };
export default function Page() {
  return <SeasonCropsView />;
}

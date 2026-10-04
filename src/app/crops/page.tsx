import type { Metadata } from 'next';
import { SuggestedCropsView } from '../../components/journey-views';
export const metadata: Metadata = { title: 'Step 2: Suggested crops — RITU' };
export default function Page() {
  return <SuggestedCropsView />;
}

import type { Metadata } from 'next';
import { EvidenceCropsView } from '../../../components/evidence-views';
export const metadata: Metadata = { title: 'Step 2 of 4: Crop choices — RITU' };
export default function Page() {
  return <EvidenceCropsView />;
}

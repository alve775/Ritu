import type { Metadata } from 'next';
import { EvidenceFarmView } from '../../../components/evidence-views';
export const metadata: Metadata = { title: 'Step 1 of 4: Your farm — RITU' };
export default function Page() {
  return <EvidenceFarmView />;
}

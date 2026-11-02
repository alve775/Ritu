import type { Metadata } from 'next';
import { EvidenceTrackingView } from '../../../components/evidence-views';
export const metadata: Metadata = { title: 'Previous rotation records — RITU' };
export default function Page() {
  return <EvidenceTrackingView />;
}

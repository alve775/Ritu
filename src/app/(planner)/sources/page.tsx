import type { Metadata } from 'next';
import { EvidenceSourcesView } from '../../../components/evidence-views';
export const metadata: Metadata = { title: 'Data sources & methods — RITU' };
export default function Page() {
  return <EvidenceSourcesView />;
}

import type { Metadata } from 'next';
import { CompareView } from '../../components/compare-view';
export const metadata: Metadata = { title: 'Step 3: Your calendar — RITU' };
export default function Page() {
  return <CompareView />;
}

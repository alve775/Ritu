import type { Metadata } from 'next';
import { TrackingView } from '../../components/journey-views';
export const metadata: Metadata = { title: 'Step 4: Track your plan — RITU' };
export default function Page() {
  return <TrackingView />;
}

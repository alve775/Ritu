import type { Metadata } from 'next';
import { FarmView } from '../../components/farm-view';
export const metadata: Metadata = { title: 'Step 1: Your farm — RITU' };
export default function Page() {
  return <FarmView />;
}

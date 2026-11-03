import type { Metadata } from 'next';
import { FarmsView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Step 1 of 4 · Dashboard — RITU' };
export default function Page() {
  return <FarmsView />;
}

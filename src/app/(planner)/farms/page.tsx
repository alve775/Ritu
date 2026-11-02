import type { Metadata } from 'next';
import { FarmsView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'My farms — RITU' };
export default function Page() {
  return <FarmsView />;
}

import type { Metadata } from 'next';
import { SeasonCropsView } from '../../../components/season-views';
export const metadata: Metadata = { title: 'Dashboard · Year plan — RITU' };
export default function Page() {
  return <SeasonCropsView />;
}

import type { Metadata } from 'next';
import { PlotSetupView } from '../../../components/plot-setup';
export const metadata: Metadata = { title: 'Step 1 of 4 · Dashboard · Plot — RITU' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { field, plot } = await searchParams;
  return (
    <PlotSetupView
      fieldId={typeof field === 'string' ? field : undefined}
      plotId={typeof plot === 'string' ? plot : undefined}
    />
  );
}

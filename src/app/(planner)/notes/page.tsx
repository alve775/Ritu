import type { Metadata } from 'next';
import { NotesPage } from '../../../components/notes/notes-page';
export const metadata: Metadata = { title: 'Step 4 of 4 · Your notes — RITU' };
export default function Page() {
  return <NotesPage />;
}

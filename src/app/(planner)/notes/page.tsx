import type { Metadata } from 'next';
import { NotesPage } from '../../../components/notes/notes-page';
export const metadata: Metadata = { title: 'Your diary — RITU' };
export default function Page() {
  return <NotesPage />;
}

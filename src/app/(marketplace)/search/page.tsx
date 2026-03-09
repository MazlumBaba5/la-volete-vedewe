import { redirect } from 'next/navigation';
import { type SearchParams } from 'next/dist/server/request/search-params';

export default function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = new URLSearchParams();
  const sp = searchParams as Record<string, string>;
  if (sp.q) query.set('q', sp.q);
  if (sp.city) query.set('citta', sp.city);
  redirect(`/annunci?${query.toString()}`);
}

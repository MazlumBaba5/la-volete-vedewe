import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MOCK_PROFILES } from '@/lib/mock-data';
import ProfileDetail from './ProfileDetail';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return MOCK_PROFILES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = MOCK_PROFILES.find((p) => p.slug === slug);
  if (!profile) return {};
  return {
    title: `${profile.name}, ${profile.age} years old – ${profile.city}`,
    description: profile.description.slice(0, 155),
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = MOCK_PROFILES.find((p) => p.slug === slug);
  if (!profile) notFound();

  const related = MOCK_PROFILES.filter(
    (p) => p.id !== profile.id && p.city === profile.city
  ).slice(0, 4);

  return <ProfileDetail profile={profile} related={related} />;
}

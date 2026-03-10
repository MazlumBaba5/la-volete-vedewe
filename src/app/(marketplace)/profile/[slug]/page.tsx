// src/app/(marketplace)/profile/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProfileBySlug, getAllProfiles } from '@/services/advisor.service'
import ProfileDetail from './ProfileDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const profiles = await getAllProfiles()
  return profiles.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const profile = await getProfileBySlug(slug)
  if (!profile) return {}
  return {
    title: `${profile.name}, ${profile.age} years old – ${profile.city}`,
    description: profile.description?.slice(0, 155) ?? '',
  }
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params
  const profile = await getProfileBySlug(slug)
  if (!profile) notFound()

  const all = await getAllProfiles()
  const related = all.filter((p) => p.id !== profile.id && p.city === profile.city).slice(0, 4)

  return <ProfileDetail profile={profile} related={related} />
}
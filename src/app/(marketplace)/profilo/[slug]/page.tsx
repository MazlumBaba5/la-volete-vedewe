import { redirect } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export default function ProfileRedirect({ params }: Props) {
  redirect(`/profile/${params.slug}`);
}

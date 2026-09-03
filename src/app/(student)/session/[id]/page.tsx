import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireUserPage } from '@/lib/auth/guards';
import { getSession } from '@/lib/services/sessions';
import { SessionRunner } from '@/components/session/runner';

export const metadata: Metadata = { title: 'Practice' };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUserPage(`/session/${id}`);

  const session = await getSession(id, user.id);
  if (!session) notFound();

  // A finished session is a review, not a runner.
  if (session.status !== 'active') redirect(`/session/${id}/review`);

  return <SessionRunner session={session} />;
}

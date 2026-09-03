'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/guards';
import { deleteAccount } from '@/lib/services/accounts';
import { destroyCurrentSession } from '@/lib/auth/session';

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await deleteAccount(user.id);
  await destroyCurrentSession();
  redirect('/');
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatPageClient from './ChatPageClient';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ChatPageClient conversationId={params.id} />;
}

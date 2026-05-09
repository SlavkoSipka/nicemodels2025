'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function StartChatButton({ modelId }: { modelId: string }) {
  const ts = useTranslations('components.chat.startButton');
  const supabase = createClient();

  async function handleStartChat() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    // Get or create conversation
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_id: user.id,
      p_other_user_id: modelId,
    });

    if (error) {
      console.error('Error creating conversation:', error);
      alert(ts('failedAlert'));
      return;
    }

    // Navigate to chat page
    window.location.href = `/chat/${conversationId}`;
  }

  return (
    <button
      onClick={handleStartChat}
      className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-lg"
    >
      {ts('label')}
    </button>
  );
}

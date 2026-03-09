'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Circle, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface ConversationData {
  id: string;
  participant1_id: string;
  participant2_id: string;
  other_user: {
    id: string;
    username: string;
    role: string;
  };
  is_online: boolean;
}

interface ChatPageClientProps {
  conversationId: string;
}

export default function ChatPageClient({ conversationId }: ChatPageClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadConversationAndMessages();

    // Real-time subscription for new messages
    const messagesChannel = supabase
      .channel(`conversation_messages_${conversationId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          console.log('📩 [Full Chat] New message received:', payload.new);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (!prev.some((msg) => msg.id === newMsg.id)) {
              console.log('✅ [Full Chat] Adding new message to list');
              return [...prev, newMsg];
            }
            console.log('⚠️ [Full Chat] Message already exists, skipping');
            return prev;
          });
          scrollToBottom();
          
          // Mark as read if message is from other user
          if (newMsg.sender_id !== currentUserId) {
            markMessageAsRead(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          console.log('📝 [Full Chat] Message updated:', payload.new);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg))
          );
        }
      )
      .subscribe((status: any) => {
        console.log('📡 [Full Chat] Messages channel status:', status);
      });

    // Real-time subscription for typing indicators
    const conversationChannel = supabase
      .channel(`conversation_typing_${conversationId}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload: any) => {
          console.log('⌨️ [Full Chat] Typing status update:', payload.new);
          const conv = payload.new;
          if (!currentUserId) return;
          
          const now = new Date().getTime();
          const participant1Typing = conv.participant1_typing_at 
            ? new Date(conv.participant1_typing_at).getTime() 
            : 0;
          const participant2Typing = conv.participant2_typing_at 
            ? new Date(conv.participant2_typing_at).getTime() 
            : 0;
          
          const isTyping = conv.participant1_id === currentUserId
            ? (now - participant2Typing < 3000)
            : (now - participant1Typing < 3000);
          
          console.log('⌨️ [Full Chat] Other user typing:', isTyping);
          setIsOtherUserTyping(isTyping);
        }
      )
      .subscribe((status: any) => {
        console.log('📡 [Full Chat] Typing channel status:', status);
      });

    return () => {
      console.log('🔌 [Full Chat] Disconnecting chat channels');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadConversationAndMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUserId(user.id);

    // Load conversation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('id, participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !convData) {
      console.error('Error loading conversation:', convError);
      setLoading(false);
      return;
    }

    // Get other user details
    const otherUserId = convData.participant1_id === user.id ? convData.participant2_id : convData.participant1_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', otherUserId)
      .single();

    // Get online status
    const { data: onlineStatus } = await supabase
      .from('online_status')
      .select('is_online')
      .eq('user_id', otherUserId)
      .single();

    setConversation({
      ...convData,
      other_user: profile || { id: otherUserId, username: 'Unknown', role: 'user' },
      is_online: onlineStatus?.is_online || false,
    });

    // Load messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
    } else {
      setMessages(messagesData || []);
    }

    // Reset unread count
    await supabase.rpc('reset_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
    });

    setLoading(false);
  }

  async function markMessageAsRead(messageId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('conversation_id', conversationId);
  }

  async function updateTypingStatus() {
    if (!conversation || !currentUserId) return;

    const isParticipant1 = conversation.participant1_id === currentUserId;
    const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';

    await supabase
      .from('conversations')
      .update({ [columnToUpdate]: new Date().toISOString() })
      .eq('id', conversationId);
  }

  function handleTyping() {
    updateTypingStatus();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      if (!conversation || !currentUserId) return;

      const isParticipant1 = conversation.participant1_id === currentUserId;
      const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';

      await supabase
        .from('conversations')
        .update({ [columnToUpdate]: null })
        .eq('id', conversationId);
    }, 3000);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || sending) return;

    setSending(true);

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (conversation) {
      const isParticipant1 = conversation.participant1_id === currentUserId;
      const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';
      await supabase
        .from('conversations')
        .update({ [columnToUpdate]: null })
        .eq('id', conversationId);
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      message_text: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } else {
      setNewMessage('');
    }

    setSending(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatMessageTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatMessageDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Conversation not found</p>
          <button
            onClick={() => router.back()}
            className="text-pink-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
            {conversation.other_user.username.charAt(0).toUpperCase()}
          </div>
          {conversation.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-bold text-gray-900">{conversation.other_user.username}</h1>
          {conversation.is_online && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Circle className="w-2 h-2 fill-green-600" />
              Online
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const messageDate = formatMessageDate(message.created_at);
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;

            const isOwn = message.sender_id === currentUserId;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {messageDate}
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{message.message_text}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p
                        className={`text-xs ${
                          isOwn ? 'text-pink-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                      {isOwn && (
                        <div className="flex items-center">
                          {message.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {isOtherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white border-t border-gray-200 p-4 sticky bottom-0"
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

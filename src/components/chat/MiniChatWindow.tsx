'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Send, Minus, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface MiniChatWindowProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    role: string;
    photo_url?: string | null;
  };
  currentUserId: string;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export default function MiniChatWindow({
  conversationId,
  otherUser,
  currentUserId,
  onClose,
  onMinimize,
  isMinimized,
}: MiniChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadMessages();
    resetUnreadCount();

    // Real-time subscription for new messages
    const messagesChannel = supabase
      .channel(`mini_chat_messages_${conversationId}`, {
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
        (payload) => {
          console.log('📩 New message received:', payload.new);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const hasTempVersion = prev.some((msg) => msg.id.toString().startsWith('temp-'));
            if (hasTempVersion && newMsg.sender_id === currentUserId) {
              console.log('🔄 Replacing temp message with real one');
              return prev.map((msg) => 
                msg.id.toString().startsWith('temp-') && msg.message_text === newMsg.message_text
                  ? newMsg
                  : msg
              );
            }
            if (!prev.some((msg) => msg.id === newMsg.id)) {
              console.log('✅ Adding new message to list');
              return [...prev, newMsg];
            }
            console.log('⚠️ Message already exists, skipping');
            return prev;
          });
          scrollToBottom();
          
          // Mark as read if chat is open and message is from other user
          if (!isMinimized && newMsg.sender_id !== currentUserId) {
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
        (payload) => {
          console.log('📝 Message updated:', payload.new);
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages channel status:', status);
      });

    // Real-time subscription for typing indicators
    const conversationChannel = supabase
      .channel(`mini_chat_typing_${conversationId}`, {
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
          console.log('⌨️ Typing status update:', payload.new);
          const conv = payload.new;
          // Determine if other user is typing
          const now = new Date().getTime();
          const participant1Typing = conv.participant1_typing_at 
            ? new Date(conv.participant1_typing_at).getTime() 
            : 0;
          const participant2Typing = conv.participant2_typing_at 
            ? new Date(conv.participant2_typing_at).getTime() 
            : 0;
          
          // Check which participant we are and if other is typing (within last 3 seconds)
          const isTyping = conv.participant1_id === currentUserId
            ? (now - participant2Typing < 3000)
            : (now - participant1Typing < 3000);
          
          console.log('⌨️ Other user typing:', isTyping);
          setIsOtherUserTyping(isTyping);
        }
      )
      .subscribe((status) => {
        console.log('📡 Typing channel status:', status);
      });

    return () => {
      console.log('🔌 Disconnecting chat channels');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [conversationId, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  }

  async function resetUnreadCount() {
    await supabase.rpc('reset_unread_count', {
      p_conversation_id: conversationId,
      p_user_id: currentUserId,
    });
  }

  async function markMessageAsRead(messageId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('conversation_id', conversationId);
  }

  async function updateTypingStatus() {
    // Determine which column to update based on current user
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (!conv) return;

    const isParticipant1 = conv.participant1_id === currentUserId;
    const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';

    await supabase
      .from('conversations')
      .update({ [columnToUpdate]: new Date().toISOString() })
      .eq('id', conversationId);
  }

  function handleTyping() {
    // Update typing status
    updateTypingStatus();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      const isParticipant1 = conv.participant1_id === currentUserId;
      const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';

      await supabase
        .from('conversations')
        .update({ [columnToUpdate]: null })
        .eq('id', conversationId);
    }, 3000);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    const messageToSend = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    console.log('📤 Sending message:', messageToSend);
    
    // Optimistic update - add message immediately
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      message_text: messageToSend,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant1_id')
      .eq('id', conversationId)
      .single();
    
    if (conv) {
      const isParticipant1 = conv.participant1_id === currentUserId;
      const columnToUpdate = isParticipant1 ? 'participant1_typing_at' : 'participant2_typing_at';
      await supabase
        .from('conversations')
        .update({ [columnToUpdate]: null })
        .eq('id', conversationId);
    }

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      message_text: messageToSend,
    }).select();

    if (error) {
      console.error('❌ Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert('Failed to send message');
      setNewMessage(messageToSend);
    } else {
      console.log('✅ Message sent successfully:', data);
    }

    setSending(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="fixed bottom-0 right-6 w-80 bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col z-50 max-h-[60vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {otherUser.photo_url ? (
            <img
              src={otherUser.photo_url}
              alt={otherUser.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
              {otherUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold truncate text-sm">{otherUser.username}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages (hidden when minimized) */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                const isTemp = message.id.toString().startsWith('temp-');
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                        isOwn
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm break-words">{message.message_text}</p>
                      <div className={`flex items-center justify-between gap-2 mt-1`}>
                        <p
                          className={`text-xs ${
                            isOwn ? 'text-pink-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                        {isOwn && !isTemp && (
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
                );
              })
            )}
            
            {/* Typing Indicator */}
            {isOtherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-2">
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
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-9 h-9 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

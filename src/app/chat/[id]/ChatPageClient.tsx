'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Send, Circle, Check, CheckCheck, Flag, X, Upload, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

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
    photo_url?: string | null;
  };
  is_online: boolean;
}

interface ChatPageClientProps {
  conversationId: string;
}

export default function ChatPageClient({ conversationId }: ChatPageClientProps) {
  const t = useTranslations('publicPages.chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportScreenshot, setReportScreenshot] = useState<File | null>(null);
  const [reportScreenshotPreview, setReportScreenshotPreview] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

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

  // Lock body scroll while the full-screen chat is mounted.
  // Prevents iOS rubber-band / underlying page movement on touch swipes.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.left = prev.bodyLeft;
      body.style.right = prev.bodyRight;
      body.style.width = prev.bodyWidth;
      body.style.overflow = prev.bodyOverflow;
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, []);

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
      .select('id, username, role, avatar_url')
      .eq('id', otherUserId)
      .single();

    // Fetch display name via server API (bypasses RLS for model shownames)
    let displayUsername = profile?.username || t('userFallback');
    try {
      const res = await fetch('/api/chat/display-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [otherUserId] }),
      });
      if (res.ok) {
        const { names } = await res.json();
        if (names?.[otherUserId]) displayUsername = names[otherUserId];
      }
    } catch { /* fallback to username */ }

    // Resolve photo: model → model_photos, others → avatar_url
    let photoUrl: string | null = profile?.avatar_url || null;
    if (profile?.role === 'model') {
      const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const { data: modelPhoto } = await supabase
        .from('model_photos')
        .select('file_path')
        .eq('model_id', otherUserId)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();
      if (modelPhoto?.file_path) {
        photoUrl = `${SUPA_URL}/storage/v1/object/public/model-photos/${modelPhoto.file_path}`;
      }
    }

    // Get online status
    const { data: onlineStatus } = await supabase
      .from('online_status')
      .select('is_online')
      .eq('user_id', otherUserId)
      .single();

    setConversation({
      ...convData,
      other_user: profile
        ? { ...profile, username: displayUsername, photo_url: photoUrl }
        : { id: otherUserId, username: t('userFallback'), role: 'user', photo_url: null },
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
      alert(t('failedToSend'));
    } else {
      setNewMessage('');
    }

    setSending(false);
  }

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setReportScreenshot(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setReportScreenshotPreview(url);
    } else {
      setReportScreenshotPreview(null);
    }
  }

  async function handleSubmitReport() {
    if (!conversation || reportSubmitting) return;
    setReportSubmitting(true);

    const fd = new FormData();
    fd.append('reported_id', conversation.other_user.id);
    fd.append('conversation_id', conversationId);
    if (reportReason.trim()) fd.append('reason', reportReason.trim());
    if (reportScreenshot) fd.append('screenshot', reportScreenshot);

    const res = await fetch('/api/reports/submit', { method: 'POST', body: fd });

    if (res.ok) {
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason('');
        setReportScreenshot(null);
        setReportScreenshotPreview(null);
      }, 2000);
    } else {
      const data = await res.json();
      alert(data.error || t('errSubmitFailed'));
    }
    setReportSubmitting(false);
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
      return t('today');
    } else if (days === 1) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-gray-500 text-sm">{t('loading')}</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center px-4">
          <p className="text-gray-500 mb-4">{t('conversationNotFound')}</p>
          <button
            onClick={() => router.back()}
            className="text-pink-600 hover:underline"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div
      className="bg-gray-50 flex flex-col fixed inset-0 overscroll-none"
      style={{ height: '100dvh', touchAction: 'none' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-1 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors shrink-0"
          aria-label={t('back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          {conversation.other_user.photo_url ? (
            <img
              src={conversation.other_user.photo_url}
              alt={conversation.other_user.username}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
              {conversation.other_user.username.charAt(0).toUpperCase()}
            </div>
          )}
          {conversation.is_online && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate leading-tight">
            {conversation.other_user.username}
          </h1>
          {conversation.is_online ? (
            <p className="text-[11px] sm:text-xs text-green-600 flex items-center gap-1 leading-tight">
              <Circle className="w-1.5 h-1.5 sm:w-2 sm:h-2 fill-green-600" />
              {t('online')}
            </p>
          ) : (
            <p className="text-[11px] sm:text-xs text-gray-400 leading-tight">{t('offline')}</p>
          )}
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          title={t('reportUser')}
          aria-label={t('reportUser')}
          className="p-2 -mr-1 text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors shrink-0"
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {t('noMessagesYet')}
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
                  <div className="text-center text-[11px] sm:text-xs text-gray-500 my-3 sm:my-4">
                    {messageDate}
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{message.message_text}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <p
                        className={`text-[10px] sm:text-xs ${
                          isOwn ? 'text-pink-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                      {isOwn && (
                        <div className="flex items-center">
                          {message.is_read ? (
                            <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-200" />
                          ) : (
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-200" />
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
            <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
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
        className="bg-white border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3 shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <div className="flex items-end gap-2 sm:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={t('typeMessage')}
            disabled={sending}
            inputMode="text"
            autoComplete="off"
            className="flex-1 min-w-0 px-4 py-2.5 sm:py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 text-base"
            style={{ fontSize: '16px' }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full flex items-center justify-center active:scale-95 sm:hover:scale-110 transition-transform disabled:opacity-50 disabled:active:scale-100 disabled:hover:scale-100"
            aria-label={t('sendMessage')}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92dvh] overflow-y-auto">
            {reportSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('reportSubmitted')}</h3>
                <p className="text-sm text-gray-500">{t('reportSubmittedHint')}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-gray-900">{t('reportTitle')}</h3>
                  </div>
                  <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                    {t.rich('reportingUser', {
                      username: conversation.other_user.username,
                      bold: (chunks) => <span className="font-bold">{chunks}</span>,
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t('reportReason')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      placeholder={t('reasonPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t('screenshot')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                    </label>
                    <input
                      ref={screenshotInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                    {reportScreenshotPreview ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={reportScreenshotPreview}
                          alt={t('screenshotPreview')}
                          width={400}
                          height={200}
                          className="w-full object-cover max-h-40"
                        />
                        <button
                          onClick={() => { setReportScreenshot(null); setReportScreenshotPreview(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center gap-1.5 text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-medium">{t('uploadScreenshot')}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={reportSubmitting}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {reportSubmitting ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('submitting')}
                      </span>
                    ) : (
                      <>
                        <Flag className="w-3.5 h-3.5" />
                        {t('submitReport')}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

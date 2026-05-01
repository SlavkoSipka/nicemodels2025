'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, X, Search, Circle } from 'lucide-react';
import MiniChatWindow from './MiniChatWindow';

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  participant1_unread_count: number;
  participant2_unread_count: number;
  other_user: {
    id: string;
    username: string;
    role: string;
    photo_url?: string | null;
  };
  is_online: boolean;
}

interface OnlineUser {
  id: string;
  username: string;
  role: string;
  photo_url: string | null;
}

interface OpenChat {
  conversationId: string;
  otherUser: OnlineUser;
  isMinimized: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'online'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [shouldTrackPresence, setShouldTrackPresence] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadConversations();
    };
    init();
  }, []);

  // Listen for external events (from AvailableForChat sidebar widget)
  useEffect(() => {
    function handleOpenWidget(e: Event) {
      const tab = (e as CustomEvent).detail?.tab as 'conversations' | 'online' | undefined;
      setIsOpen(true);
      if (tab) setActiveTab(tab);
    }

    async function handleOpenWithModel(e: Event) {
      const { modelId, modelName, modelPhoto } = (e as CustomEvent).detail || {};
      if (!modelId || !currentUserId) return;

      setStartingChat(modelId);
      try {
        const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
          p_user_id: currentUserId,
          p_other_user_id: modelId,
        });
        if (error || !conversationId) return;

        const otherUser: OnlineUser = {
          id: modelId,
          username: modelName || 'Model',
          role: 'model',
          photo_url: modelPhoto || null,
        };

        setOpenChats(prev => {
          const existing = prev.find(c => c.conversationId === conversationId);
          if (existing) {
            return prev.map(c => c.conversationId === conversationId ? { ...c, isMinimized: false } : c);
          }
          return [...prev, { conversationId, otherUser, isMinimized: false }];
        });
        setIsOpen(false);
      } finally {
        setStartingChat(null);
      }
    }

    function handleChatAvailableChanged(e: Event) {
      const available = (e as CustomEvent).detail?.available as boolean;
      setShouldTrackPresence(available);
    }

    window.addEventListener('open-chat-widget', handleOpenWidget);
    window.addEventListener('open-chat-with-model', handleOpenWithModel);
    window.addEventListener('chat-available-changed', handleChatAvailableChanged);
    return () => {
      window.removeEventListener('open-chat-widget', handleOpenWidget);
      window.removeEventListener('open-chat-with-model', handleOpenWithModel);
      window.removeEventListener('chat-available-changed', handleChatAvailableChanged);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Presence channel for real-time online tracking
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        updateOnlineUsers(presenceChannel.presenceState());
      })
      .on('presence', { event: 'join' }, () => {
        updateOnlineUsers(presenceChannel.presenceState());
      })
      .on('presence', { event: 'leave' }, () => {
        updateOnlineUsers(presenceChannel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && shouldTrackPresence) {
          await presenceChannel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Real-time subscription for new messages
    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, shouldTrackPresence]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    // Check role and chat_available flag for models
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let trackable = true;
    if (profile?.role === 'model') {
      const { data: details } = await supabase
        .from('model_details')
        .select('chat_available')
        .eq('model_id', user.id)
        .single();
      trackable = details?.chat_available === true;
    }

    setShouldTrackPresence(trackable);

    await supabase
      .from('online_status')
      .upsert({
        user_id: user.id,
        is_online: trackable,
        is_available_for_chat: trackable,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  }

  async function updateOnlineUsers(presenceState: any) {
    const onlineUserIds = Object.keys(presenceState).flatMap((key) =>
      presenceState[key].map((presence: any) => presence.user_id)
    );

    if (onlineUserIds.length === 0) {
      setOnlineUsers([]);
      return;
    }

    // Fetch user details for online users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url')
      .in('id', onlineUserIds)
      .neq('id', currentUserId || '');

    if (!profiles) {
      setOnlineUsers([]);
      return;
    }

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Batch fetch model photos and club photos
    const modelIds = profiles.filter(p => p.role === 'model').map(p => p.id);
    const clubIds = profiles.filter(p => p.role === 'company').map(p => p.id);

    const [{ data: modelPhotos }, { data: clubPhotos }] = await Promise.all([
      modelIds.length
        ? supabase.from('model_photos').select('model_id, file_path')
            .in('model_id', modelIds).eq('is_approved', true)
            .order('uploaded_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      clubIds.length
        ? supabase.from('club_photos').select('club_id, file_path')
            .in('club_id', clubIds).eq('is_approved', true)
            .order('uploaded_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const modelPhotoMap = new Map<string, string>();
    for (const p of modelPhotos || []) {
      if (!modelPhotoMap.has(p.model_id) && p.file_path)
        modelPhotoMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`);
    }
    const clubPhotoMap = new Map<string, string>();
    for (const p of clubPhotos || []) {
      if (!clubPhotoMap.has(p.club_id) && p.file_path)
        clubPhotoMap.set(p.club_id, `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`);
    }

    // Fetch display names via server API
    let onlineDisplayNames = new Map<string, string>();
    const onlineIds = profiles.map((p: any) => p.id);
    if (onlineIds.length > 0) {
      try {
        const res = await fetch('/api/chat/display-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: onlineIds }),
        });
        if (res.ok) {
          const { names } = await res.json();
          onlineDisplayNames = new Map(Object.entries(names || {}));
        }
      } catch { /* fallback to username */ }
    }

    const usersWithPhotos = profiles.map((profile: any) => ({
      id: profile.id,
      role: profile.role,
      username: onlineDisplayNames.get(profile.id) || profile.username,
      photo_url: profile.role === 'model'
        ? (modelPhotoMap.get(profile.id) || null)
        : profile.role === 'company'
          ? (clubPhotoMap.get(profile.id) || null)
          : (profile.avatar_url || null),
    }));

    setOnlineUsers(usersWithPhotos);
  }

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant1_id,
        participant2_id,
        last_message_text,
        last_message_at,
        participant1_unread_count,
        participant2_unread_count
      `)
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
      return;
    }

    // Collect all other user IDs at once
    const otherUserIds = (data || []).map(conv =>
      conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
    );

    const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Fetch profiles, online status, model photos in parallel
    const [{ data: profiles }, { data: onlineStatuses }, { data: modelPhotos }] = await Promise.all([
      supabase.from('profiles').select('id, username, role, avatar_url').in('id', otherUserIds),
      supabase.from('online_status').select('user_id, is_online').in('user_id', otherUserIds),
      supabase.from('model_photos').select('model_id, file_path')
        .in('model_id', otherUserIds).eq('is_approved', true)
        .order('uploaded_at', { ascending: false }),
    ]);

    // Fetch display names via server API (bypasses RLS)
    let displayNameMap = new Map<string, string>();
    if (otherUserIds.length > 0) {
      try {
        const res = await fetch('/api/chat/display-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: otherUserIds }),
        });
        if (res.ok) {
          const { names } = await res.json();
          displayNameMap = new Map(Object.entries(names || {}));
        }
      } catch { /* fallback to username */ }
    }

    const photoMap = new Map<string, string>();
    for (const p of modelPhotos || []) {
      if (!photoMap.has(p.model_id) && p.file_path) {
        photoMap.set(p.model_id, `${SUPA}/storage/v1/object/public/model-photos/${p.file_path}`);
      }
    }

    const profileMap = new Map((profiles || []).map((p: any) => {
      const displayName = displayNameMap.get(p.id) || p.username;
      return [p.id, { id: p.id, username: displayName, role: p.role, avatar_url: p.avatar_url }];
    }));
    const onlineMap = new Map((onlineStatuses || []).map(s => [s.user_id, s.is_online]));

    const conversationsWithUsers = (data || []).map(conv => {
      const otherUserId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;
      const profile = profileMap.get(otherUserId);
      const resolvedPhoto = profile
        ? (photoMap.get(otherUserId) || profile.avatar_url || null)
        : null;
      return {
        ...conv,
        other_user: profile
          ? { ...profile, photo_url: resolvedPhoto }
          : { id: otherUserId, username: 'User', role: 'user', photo_url: null },
        is_online: onlineMap.get(otherUserId) || false,
      };
    });

    setConversations(conversationsWithUsers);
    setLoading(false);
  }

  async function handleStartChatWithUser(userId: string) {
    if (startingChat) return; // Prevent double clicks
    setStartingChat(userId);

    try {
      // Get or create conversation
      const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_id: currentUserId,
        p_other_user_id: userId,
      });

      if (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to start chat. Please try again.');
        return;
      }

      // Find the user details
      const user = onlineUsers.find((u) => u.id === userId);
      if (!user) return;

      // Check if chat is already open
      const existingChat = openChats.find((chat) => chat.conversationId === conversationId);
      if (existingChat) {
        // Unminimize if minimized
        setOpenChats((prev) =>
          prev.map((chat) =>
            chat.conversationId === conversationId ? { ...chat, isMinimized: false } : chat
          )
        );
      } else {
        // Open new mini chat window
        setOpenChats((prev) => [
          ...prev,
          {
            conversationId,
            otherUser: user,
            isMinimized: false,
          },
        ]);
      }

      // Close the main chat widget
      setIsOpen(false);
    } finally {
      setStartingChat(null);
    }
  }

  function handleOpenConversation(conversation: Conversation) {
    // Check if chat is already open
    const existingChat = openChats.find((chat) => chat.conversationId === conversation.id);
    if (existingChat) {
      // Unminimize if minimized
      setOpenChats((prev) =>
        prev.map((chat) =>
          chat.conversationId === conversation.id ? { ...chat, isMinimized: false } : chat
        )
      );
    } else {
      // Open new mini chat window
      setOpenChats((prev) => [
        ...prev,
        {
          conversationId: conversation.id,
          otherUser: {
            id: conversation.other_user.id,
            username: conversation.other_user.username,
            role: conversation.other_user.role,
            photo_url: conversation.other_user.photo_url || null,
          },
          isMinimized: false,
        },
      ]);
    }

    // Close the main chat widget
    setIsOpen(false);
  }

  function handleCloseChat(conversationId: string) {
    setOpenChats((prev) => prev.filter((chat) => chat.conversationId !== conversationId));
  }

  function handleMinimizeChat(conversationId: string) {
    setOpenChats((prev) =>
      prev.map((chat) =>
        chat.conversationId === conversationId
          ? { ...chat, isMinimized: !chat.isMinimized }
          : chat
      )
    );
  }

  function getUnreadCount(conversation: Conversation) {
    if (!currentUserId) return 0;
    return currentUserId === conversation.participant1_id
      ? conversation.participant1_unread_count
      : conversation.participant2_unread_count;
  }

  function getTotalUnread() {
    return conversations.reduce((total, conv) => total + getUnreadCount(conv), 0);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnlineUsers = onlineUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = getTotalUnread();
  const onlineCount = onlineUsers.length;

  if (!currentUserId) return null;

  return (
    <>
      {/* Chat Button (Fixed bottom right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-3 right-3 sm:left-auto sm:right-6 z-50 sm:w-96 h-[calc(100vh-8rem)] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5" />
              <span className="font-bold">Chat</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === 'conversations'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Conversations ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === 'online'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Online Now ({onlineCount})
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
              />
            </div>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : activeTab === 'conversations' ? (
              // Conversations Tab
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => {
                    const unreadCount = getUnreadCount(conversation);
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleOpenConversation(conversation)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          {conversation.other_user.photo_url ? (
                            <img
                              src={conversation.other_user.photo_url}
                              alt={conversation.other_user.username}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                              {conversation.other_user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {conversation.is_online && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                              {conversation.other_user.username}
                            </span>
                            {conversation.last_message_at && (
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {formatDate(conversation.last_message_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                              {conversation.other_user.role === 'model' ? '💎 Model' : 
                               conversation.other_user.role === 'company' ? '🏢 Agency' : 
                               conversation.other_user.role === 'admin' ? '⚙️ Admin' : 
                               '👤 User'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.last_message_text || 'Start a conversation'}
                          </p>
                        </div>

                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                          <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              // Online Now Tab
              filteredOnlineUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'No online users found' : 'No users online right now'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredOnlineUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartChatWithUser(user.id)}
                      disabled={startingChat === user.id}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
                    >
                      {/* Avatar/Photo */}
                      <div className="relative flex-shrink-0">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <Circle className="w-2 h-2 fill-green-600" />
                          Online
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="flex-shrink-0">
                        <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded-full font-medium">
                          {user.role === 'model' ? '💎 Model' : user.role === 'company' ? '🏢 Club' : user.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span>You are available to chat</span>
            </div>
          </div>
        </div>
      )}

      {/* Mini Chat Windows */}
      {openChats.map((chat, index) => (
        <div
          key={chat.conversationId}
          style={{
            right: `${24 + index * 336}px`, // 24px initial + 336px per window (320px width + 16px gap)
          }}
        >
          <MiniChatWindow
            conversationId={chat.conversationId}
            otherUser={chat.otherUser}
            currentUserId={currentUserId || ''}
            onClose={() => handleCloseChat(chat.conversationId)}
            onMinimize={() => handleMinimizeChat(chat.conversationId)}
            isMinimized={chat.isMinimized}
          />
        </div>
      ))}
    </>
  );
}

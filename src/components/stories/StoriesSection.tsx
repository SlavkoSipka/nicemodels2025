'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, User } from 'lucide-react';
import Link from 'next/link';
import StoryViewer from './StoryViewer';

interface ModelStory {
  model_id: string;
  model_username: string;
  model_showname: string;
  model_photo: string | null;
  total_stories: number;
  unviewed_stories: number;
  latest_story_at: string;
  stories: Array<{
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    thumbnail_url: string | null;
    caption: string | null;
    duration: number;
    created_at: string;
    expires_at: string;
    views_count: number;
    viewed_by_me: boolean;
  }>;
}

export default function StoriesSection() {
  const [modelStories, setModelStories] = useState<ModelStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewingModelIndex, setViewingModelIndex] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
    loadStories();
  }, []);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setCurrentUser({ ...user, role: profile?.role });
    }
  }

  async function loadStories() {
    try {
      const { data, error } = await supabase.rpc('get_active_model_stories');
      if (!error) {
        setModelStories(data || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  function openStoryViewer(index: number) {
    setViewingModelIndex(index);
  }

  function closeStoryViewer() {
    setViewingModelIndex(null);
    loadStories();
  }

  if (loading) {
    return (
      <div className="py-3 sm:py-5" style={{ background: '#e8f4fd', borderBottom: '1px solid rgba(137,207,240,0.25)' }}>
        <div className="max-w-[1280px] mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full animate-pulse" style={{ background: '#f1f5f9' }} />
                <div className="w-10 sm:w-12 h-2 rounded mt-1.5 sm:mt-2 mx-auto animate-pulse" style={{ background: '#f1f5f9' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isModel = currentUser?.role === 'model';
  const hasAddButton = isModel;
  const totalSlots = 16;
  const ghostCount = Math.max(0, totalSlots - modelStories.length - (hasAddButton ? 1 : 0));

  if (modelStories.length === 0 && !hasAddButton) {
    return null;
  }

  return (
    <>
      <div className="py-3 sm:py-5" style={{ background: '#e8f4fd', borderBottom: '1px solid rgba(137,207,240,0.25)' }}>
        <div className="max-w-[1280px] mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-hide">

            {/* Add Story */}
            {hasAddButton && (
              <Link href="/dashboard/model/upload-story" className="flex-shrink-0 text-center group">
                <div className="relative">
                  <div
                    className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center transition-all p-[2px] sm:p-0"
                    style={{
                      background: '#fef7fa',
                      border: '1.5px dashed #f9a8d4',
                    }}
                  >
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ec4899' }} />
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium mt-1 sm:mt-2 truncate w-14 sm:w-[72px]" style={{ color: '#94a3b8' }}>Add Story</p>
              </Link>
            )}

            {/* Stories */}
            {modelStories.map((modelStory) => {
              const hasUnviewed = modelStory.unviewed_stories > 0;
              const photoUrl = modelStory.model_photo
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${modelStory.model_photo}`
                : null;

              return (
                <button
                  key={modelStory.model_id}
                  onClick={() => openStoryViewer(modelStories.indexOf(modelStory))}
                  className="flex-shrink-0 text-center group"
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full p-[2px] sm:p-[2.5px]"
                      style={{
                        background: hasUnviewed
                          ? 'linear-gradient(135deg, #ec4899, #f9a8d4, #89CFF0)'
                          : '#e2e8f0',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full overflow-hidden"
                        style={{ border: '2px solid #e8f4fd', background: '#f1f5f9' }}
                      >
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={modelStory.model_showname}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg"
                            style={{ background: 'linear-gradient(135deg, #ec4899, #f9a8d4)' }}
                          >
                            {modelStory.model_showname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {modelStory.total_stories > 1 && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold"
                        style={{ background: '#ec4899', color: 'white', border: '2px solid #e8f4fd' }}
                      >
                        {modelStory.total_stories}
                      </div>
                    )}
                  </div>
                  <p
                    className="text-[10px] sm:text-[11px] font-medium mt-1 sm:mt-2 truncate w-14 sm:w-[72px]"
                    style={{ color: hasUnviewed ? '#475569' : '#94a3b8' }}
                  >
                    {modelStory.model_showname}
                  </p>
                </button>
              );
            })}

            {/* Ghost placeholders */}
            {Array.from({ length: ghostCount }).map((_, i) => (
              <div
                key={`ghost-${i}`}
                className="flex-shrink-0 text-center pointer-events-none select-none"
                aria-hidden
              >
                <div
                  className="w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center"
                  style={{
                    background: '#f8fafc',
                    border: '1.5px dashed #e2e8f0',
                  }}
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#cbd5e1' }} />
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium mt-1 sm:mt-2 w-14 sm:w-[72px] truncate" style={{ color: '#e2e8f0' }}>—</p>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewingModelIndex !== null && (
        <StoryViewer
          allModelStories={modelStories}
          initialModelIndex={viewingModelIndex}
          onClose={closeStoryViewer}
        />
      )}
    </>
  );
}

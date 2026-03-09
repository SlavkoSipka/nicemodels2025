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
      <div className="py-6" style={{ backgroundColor: '#BE185D' }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="w-20 h-20 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="w-12 h-2.5 rounded mt-2 mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
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

  // Hide the section only if there are truly no stories and user is not a model
  if (modelStories.length === 0 && !hasAddButton) {
    return null;
  }

  return (
    <>
      <div className="py-6" style={{ backgroundColor: '#BE185D' }}>
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">

            {/* Add Story button for models */}
            {hasAddButton && (
              <Link href="/dashboard/model/upload-story" className="flex-shrink-0 text-center group">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '2px dashed rgba(0,0,0,0.35)',
                    }}
                  >
                    <Plus className="w-7 h-7" style={{ color: 'rgba(0,0,0,0.4)' }} />
                  </div>
                </div>
                <p className="text-xs font-semibold mt-2 truncate w-20" style={{ color: 'rgba(255,255,255,0.45)' }}>Add Story</p>
              </Link>
            )}

            {/* Real stories */}
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
                    {/* ring: unviewed = dark bg color (invisible border = blends), viewed = grey */}
                    <div
                      className="w-20 h-20 rounded-full p-[3px]"
                      style={{
                        background: hasUnviewed
                          ? '#16181d'          /* same as bg → ring not visible → photo pops cleanly */
                          : 'rgba(255,255,255,0.18)',  /* grey ring for viewed */
                        boxShadow: hasUnviewed
                          ? 'inset 0 0 0 2.5px #EC4899'
                          : 'none',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full overflow-hidden"
                        style={{ border: '2px solid #16181d', background: '#2a2d34' }}
                      >
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={modelStory.model_showname}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #BE185D, #EC4899)' }}>
                            {modelStory.model_showname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {modelStory.total_stories > 1 && (
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: '#EC4899', color: 'white', border: '2px solid #16181d' }}
                      >
                        {modelStory.total_stories}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold mt-2 truncate w-20" style={{ color: hasUnviewed ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)' }}>
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
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                  background: 'rgba(0,0,0,0.18)',
                  border: '1.5px dashed rgba(0,0,0,0.3)',
                  }}
                >
                  <User className="w-7 h-7" style={{ color: 'rgba(0,0,0,0.3)' }} />
                </div>
                <p className="text-xs font-medium mt-2 w-20 truncate" style={{ color: 'rgba(255,255,255,0.15)' }}>—</p>
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

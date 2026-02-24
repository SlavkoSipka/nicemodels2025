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
  const [viewingStory, setViewingStory] = useState<ModelStory | null>(null);
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

  function openStoryViewer(modelStory: ModelStory) {
    setViewingStory(modelStory);
  }

  function closeStoryViewer() {
    setViewingStory(null);
    // Reload stories to update view counts
    loadStories();
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-16 h-3 bg-gray-200 rounded mt-2 mx-auto animate-pulse" />
            </div>
          ))}
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
      <div className="py-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Add Story button for models */}
            {hasAddButton && (
              <Link href="/dashboard/model/upload-story" className="flex-shrink-0 text-center group">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-gray-200 group-hover:border-pink-500 transition-all">
                    <Plus className="w-8 h-8 text-gray-600 group-hover:text-pink-600" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mt-2 truncate w-20">Add Story</p>
              </Link>
            )}

            {/* Model Stories */}
            {modelStories.map((modelStory) => {
              const hasUnviewed = modelStory.unviewed_stories > 0;
              const photoUrl = modelStory.model_photo
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${modelStory.model_photo}`
                : null;

              return (
                <button
                  key={modelStory.model_id}
                  onClick={() => openStoryViewer(modelStory)}
                  className="flex-shrink-0 text-center group"
                >
                  <div className="relative">
                    <div
                      className={`w-20 h-20 rounded-full p-[3px] ${
                        hasUnviewed
                          ? 'bg-gradient-to-tr from-pink-600 via-rose-600 to-orange-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      <div className="w-full h-full bg-white rounded-full p-[3px]">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={modelStory.model_showname}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                            {modelStory.model_showname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {modelStory.total_stories > 1 && (
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                        {modelStory.total_stories}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 mt-2 truncate w-20">
                    {modelStory.model_showname}
                  </p>
                </button>
              );
            })}

            {/* Ghost placeholders – samo dizajn, ne klikaju se; uklanjaju se kako dolaze pravi story-i */}
            {Array.from({ length: ghostCount }).map((_, i) => (
              <div
                key={`ghost-${i}`}
                className="flex-shrink-0 text-center pointer-events-none select-none"
                aria-hidden
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-400 mt-2 w-20 truncate">—</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          modelStory={viewingStory}
          onClose={closeStoryViewer}
        />
      )}
    </>
  );
}

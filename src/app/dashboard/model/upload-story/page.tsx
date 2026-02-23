'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, Image as ImageIcon, Video, X, Loader2, Clock, Trash2 } from 'lucide-react';

export default function UploadStoryPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    loadActiveStories();
  }, []);

  async function loadActiveStories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('model_stories')
        .select('*')
        .eq('model_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      setActiveStories(data || []);
    } catch {}
    finally { setLoadingStories(false); }
  }

  async function deleteStory(story: any) {
    if (!confirm('Delete this story?')) return;
    setDeletingId(story.id);
    try {
      await supabase.from('model_stories').delete().eq('id', story.id);
      if (story.media_url) {
        await supabase.storage.from('model-stories').remove([story.media_url]);
      }
      setActiveStories(prev => prev.filter(s => s.id !== story.id));
    } catch {}
    finally { setDeletingId(null); }
  }

  function timeLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  }

  function storyMediaUrl(path: string) {
    return `${SUPABASE_URL}/storage/v1/object/public/model-stories/${path}`;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Please select an image or video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function clearSelection() {
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    setDuration(5);
    setError('');
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in');
        return;
      }

      // Check if user is a model
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'model') {
        setError('Only models can upload stories');
        return;
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('model-stories')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload file: ' + uploadError.message);
        return;
      }

      // Create story record in database
      const { error: dbError } = await supabase
        .from('model_stories')
        .insert({
          model_id: user.id,
          media_type: mediaType,
          media_url: uploadData.path,
          caption: caption.trim() || null,
          duration: mediaType === 'image' ? duration : null,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to delete uploaded file
        await supabase.storage.from('model-stories').remove([fileName]);
        setError('Failed to create story: ' + dbError.message);
        return;
      }

      // Success!
      clearSelection();
      await loadActiveStories();
      alert('Story uploaded successfully!');
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  }

  const fileType = selectedFile?.type.startsWith('image/') ? 'image' : 'video';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Story</h1>
          <p className="text-gray-600 mb-6">Share a photo or video that will be visible for 24 hours</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {!selectedFile ? (
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">Click to upload</p>
                  <p className="text-sm text-gray-500">Image or Video (max 50MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <button
                  onClick={clearSelection}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {fileType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-96 object-contain"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-96 object-contain"
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{caption.length}/200</p>
              </div>

              {/* Duration (for images only) */}
              {fileType === 'image' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={3}>3 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={7}>7 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-xl hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Post Story
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Your story will be visible for 24 hours
              </p>
            </div>
          )}
        </div>

        {/* ── Active stories ── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand" />
            <h2 className="text-base font-bold text-gray-900">Active stories</h2>
            {!loadingStories && (
              <span className="ml-auto text-xs text-gray-400">{activeStories.length} active</span>
            )}
          </div>

          {loadingStories ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : activeStories.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No active stories. Upload one above!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeStories.map(story => (
                <div key={story.id} className="relative group rounded-lg overflow-hidden bg-black aspect-[9/16]">
                  {story.media_type === 'video' ? (
                    <video
                      src={storyMediaUrl(story.media_url)}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                    />
                  ) : (
                    <img
                      src={storyMediaUrl(story.media_url)}
                      alt={story.caption || 'Story'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {story.media_type === 'video' ? 'Video' : 'Photo'}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteStory(story)}
                    disabled={deletingId === story.id}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === story.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {story.caption && (
                      <p className="text-white text-xs font-medium line-clamp-2 mb-1">{story.caption}</p>
                    )}
                    <div className="flex items-center gap-1 text-white/70 text-xs">
                      <Clock className="w-3 h-3" />
                      {timeLeft(story.expires_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

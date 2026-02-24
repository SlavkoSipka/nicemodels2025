'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, Clock, Trash2, Camera, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadStoryPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStories, setActiveStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => { loadActiveStories(); }, []);

  async function loadActiveStories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('model_stories').select('*').eq('model_id', user.id)
        .gte('expires_at', new Date().toISOString()).order('created_at', { ascending: false });
      setActiveStories(data || []);
    } catch {}
    finally { setLoadingStories(false); }
  }

  async function deleteStory(story: any) {
    if (!confirm('Delete this story?')) return;
    setDeletingId(story.id);
    try {
      await supabase.from('model_stories').delete().eq('id', story.id);
      if (story.media_url) await supabase.storage.from('model-stories').remove([story.media_url]);
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
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { setError('Please select an image or video file'); return; }
    if (file.size > 50 * 1024 * 1024) { setError('File size must be less than 50MB'); return; }
    setSelectedFile(file); setError('');
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelection() {
    setSelectedFile(null); setPreviewUrl(''); setCaption(''); setDuration(5); setError('');
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'model') { setError('Only models can upload stories'); return; }
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('model-stories').upload(fileName, selectedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) { setError('Failed to upload file: ' + uploadError.message); return; }
      const { error: dbError } = await supabase.from('model_stories').insert({
        model_id: user.id, media_type: mediaType, media_url: uploadData.path,
        caption: caption.trim() || null, duration: mediaType === 'image' ? duration : null,
      });
      if (dbError) {
        await supabase.storage.from('model-stories').remove([fileName]);
        setError('Failed to create story: ' + dbError.message); return;
      }
      clearSelection(); await loadActiveStories();
      setSuccess('Story uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('An unexpected error occurred'); }
    finally { setUploading(false); }
  }

  const fileType = selectedFile?.type.startsWith('image/') ? 'image' : 'video';

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload Story</h1>
              <p className="text-xs text-gray-500">Share a photo or video visible for 24 hours</p>
            </div>
          </div>
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">Back</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        {/* Upload card */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          {!selectedFile ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center hover:border-brand hover:bg-brand/5 transition-colors">
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload</p>
                <p className="text-xs text-gray-400">Image or Video (max 50MB)</p>
              </div>
              <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <button onClick={clearSelection}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70">
                  <X className="w-4 h-4" />
                </button>
                {fileType === 'image'
                  ? <img src={previewUrl} alt="Preview" className="w-full h-72 object-contain" />
                  : <video src={previewUrl} controls className="w-full h-72 object-contain" />
                }
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Caption (optional)</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption..." maxLength={200} rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
                <p className="text-xs text-gray-400 mt-0.5">{caption.length}/200</p>
              </div>
              {fileType === 'image' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Display Duration</label>
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value={3}>3 seconds</option>
                    <option value={5}>5 seconds</option>
                    <option value={7}>7 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </div>
              )}
              <button onClick={handleUpload} disabled={uploading}
                className="w-full py-2.5 bg-brand text-white rounded-lg font-bold text-sm hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Post Story</>}
              </button>
              <p className="text-xs text-gray-400 text-center">Visible for 24 hours</p>
            </div>
          )}
        </div>

        {/* Active stories */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-brand" />
            <p className="text-sm font-bold text-gray-800">Active stories</p>
            {!loadingStories && (
              <span className="ml-auto text-xs text-gray-400">{activeStories.length} active</span>
            )}
          </div>
          {loadingStories ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : activeStories.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No active stories. Upload one above!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeStories.map(story => (
                <div key={story.id} className="relative group rounded-lg overflow-hidden bg-black aspect-[9/16]">
                  {story.media_type === 'video' ? (
                    <video src={storyMediaUrl(story.media_url)} className="w-full h-full object-cover" muted playsInline
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                  ) : (
                    <img src={storyMediaUrl(story.media_url)} alt={story.caption || 'Story'} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold text-white bg-black/40 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      {story.media_type === 'video' ? 'Video' : 'Photo'}
                    </span>
                  </div>
                  <button onClick={() => deleteStory(story)} disabled={deletingId === story.id}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    {deletingId === story.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {story.caption && <p className="text-white text-[10px] font-medium line-clamp-1 mb-0.5">{story.caption}</p>}
                    <div className="flex items-center gap-1 text-white/70 text-[10px]">
                      <Clock className="w-2.5 h-2.5" />{timeLeft(story.expires_at)}
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

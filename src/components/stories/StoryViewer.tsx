'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

interface Story {
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
}

interface ModelStory {
  model_id: string;
  model_username: string;
  model_showname: string;
  model_photo: string | null;
  stories: Story[];
}

interface StoryViewerProps {
  allModelStories: ModelStory[];
  initialModelIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ allModelStories, initialModelIndex, onClose }: StoryViewerProps) {
  const [currentModelIndex, setCurrentModelIndex] = useState(initialModelIndex);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStoryIndex = useRef(0);
  const supabase = createClient();

  const modelStory = allModelStories[currentModelIndex];
  // Guard against stale currentIndex during model switch
  const safeIndex = Math.min(currentIndex, modelStory.stories.length - 1);
  const currentStory = modelStory.stories[safeIndex];
  const isFirstStory = safeIndex === 0;
  const isLastStory = safeIndex === modelStory.stories.length - 1;
  const hasPrevModel = currentModelIndex > 0;
  const hasNextModel = currentModelIndex < allModelStories.length - 1;
  const prevModel = hasPrevModel ? allModelStories[currentModelIndex - 1] : null;
  const nextModel = hasNextModel ? allModelStories[currentModelIndex + 1] : null;

  if (!currentStory) return null;

  const mediaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-stories/${currentStory.media_url}`;

  useEffect(() => {
    setCurrentIndex(pendingStoryIndex.current);
    pendingStoryIndex.current = 0;
    setProgress(0);
  }, [currentModelIndex]);

  useEffect(() => {
    markAsViewed(currentStory.id);
    setProgress(0);
    if (!isPaused) startProgress();
    return () => stopProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentModelIndex]);

  useEffect(() => {
    if (isPaused) {
      stopProgress();
    } else {
      startProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  async function markAsViewed(storyId: string) {
    try {
      await supabase.rpc('mark_story_viewed', { p_story_id: storyId });
    } catch {
      // silent fail
    }
  }

  function startProgress() {
    stopProgress();
    const duration = currentStory.media_type === 'image'
      ? currentStory.duration * 1000
      : (videoRef.current?.duration || 5) * 1000;
    const interval = 50;
    const increment = (interval / duration) * 100;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          goToNext();
          return 0;
        }
        return next;
      });
    }, interval);
  }

  function stopProgress() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  function goToNext() {
    stopProgress();
    if (!isLastStory) {
      setCurrentIndex((prev) => prev + 1);
    } else if (hasNextModel) {
      pendingStoryIndex.current = 0;
      setCurrentModelIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }

  function goToPrevious() {
    stopProgress();
    if (!isFirstStory) {
      setCurrentIndex((prev) => prev - 1);
    } else if (hasPrevModel) {
      pendingStoryIndex.current = allModelStories[currentModelIndex - 1].stories.length - 1;
      setCurrentModelIndex((prev) => prev - 1);
    }
  }

  function goToModel(idx: number) {
    stopProgress();
    pendingStoryIndex.current = 0;
    setCurrentModelIndex(idx);
  }

  function togglePause() {
    setIsPaused((p) => !p);
    if (videoRef.current) {
      isPaused ? videoRef.current.play() : videoRef.current.pause();
    }
  }

  function toggleMute() {
    setIsMuted((m) => !m);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  }

  function handleVideoEnded() { goToNext(); }

  function handleVideoLoadedMetadata() {
    if (videoRef.current && !isPaused) {
      videoRef.current.play();
      startProgress();
    }
  }

  function getPhotoUrl(m: ModelStory) {
    return m.model_photo
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${m.model_photo}`
      : null;
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">

      {/* Prev model — left strip */}
      {hasPrevModel && prevModel && (
        <button
          onClick={() => goToModel(currentModelIndex - 1)}
          className="absolute left-0 top-0 bottom-0 w-[72px] z-20 flex flex-col items-center justify-center gap-2 group"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)' }}
        >
          <ChevronLeft className="w-7 h-7 text-white/70 group-hover:text-white transition-colors" />
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 group-hover:border-white/80 transition-all">
            {getPhotoUrl(prevModel) ? (
              <img src={getPhotoUrl(prevModel)!} alt={prevModel.model_showname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#BE185D,#EC4899)' }}>
                {prevModel.model_showname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-white/60 text-[10px] font-medium group-hover:text-white/90 transition-colors max-w-[60px] truncate text-center">
            {prevModel.model_showname}
          </p>
        </button>
      )}

      {/* Next model — right strip */}
      {hasNextModel && nextModel && (
        <button
          onClick={() => goToModel(currentModelIndex + 1)}
          className="absolute right-0 top-0 bottom-0 w-[72px] z-20 flex flex-col items-center justify-center gap-2 group"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
        >
          <ChevronRight className="w-7 h-7 text-white/70 group-hover:text-white transition-colors" />
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/40 group-hover:border-white/80 transition-all">
            {getPhotoUrl(nextModel) ? (
              <img src={getPhotoUrl(nextModel)!} alt={nextModel.model_showname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#BE185D,#EC4899)' }}>
                {nextModel.model_showname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-white/60 text-[10px] font-medium group-hover:text-white/90 transition-colors max-w-[60px] truncate text-center">
            {nextModel.model_showname}
          </p>
        </button>
      )}

      {/* Story panel */}
      <div className="relative w-full h-full max-w-lg mx-auto flex flex-col">

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 pointer-events-none">
          {modelStory.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header — z-30 so it's above tap zones */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center justify-between">
            <Link
              href={`/models/${modelStory.model_id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity pointer-events-auto"
            >
              {getPhotoUrl(modelStory) ? (
                <img
                  src={getPhotoUrl(modelStory)!}
                  alt={modelStory.model_showname}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold border-2 border-white">
                  {modelStory.model_showname.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm underline-offset-2 hover:underline">
                  {modelStory.model_showname}
                </p>
                <p className="text-white/80 text-xs">
                  {Math.floor((Date.now() - new Date(currentStory.created_at).getTime()) / 3600000)}h ago
                </p>
                <p className="text-white/55 text-[10px] mt-0.5 leading-tight">
                  Go to the profile
                </p>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.media_type === 'image' ? (
            <img
              src={mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
              onLoad={() => !isPaused && startProgress()}
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-contain"
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleVideoLoadedMetadata}
              muted={isMuted}
              playsInline
            />
          )}

          {currentStory.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
              <p className="text-white text-center">{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Tap zones — z-10, below the header (z-30) */}
        <button
          onClick={goToPrevious}
          disabled={isFirstStory && !hasPrevModel}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer disabled:cursor-default"
          style={{ background: 'transparent' }}
          aria-label="Previous"
        />
        <button
          onClick={goToNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
          style={{ background: 'transparent' }}
          aria-label="Next"
        />

        {/* Controls */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-3 z-20">
          <button
            onClick={togglePause}
            className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          {currentStory.media_type === 'video' && (
            <button
              onClick={toggleMute}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Views Count */}
        <div className="absolute bottom-6 left-6 text-white/80 text-sm flex items-center gap-1 z-20 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {currentStory.views_count}
        </div>

        {/* Model counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs z-20 pointer-events-none">
          {currentModelIndex + 1} / {allModelStories.length}
        </div>
      </div>
    </div>
  );
}

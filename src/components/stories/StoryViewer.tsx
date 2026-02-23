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
  modelStory: ModelStory;
  onClose: () => void;
}

export default function StoryViewer({ modelStory, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const currentStory = modelStory.stories[currentIndex];
  const isLastStory = currentIndex === modelStory.stories.length - 1;

  const mediaUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-stories/${currentStory.media_url}`;

  useEffect(() => {
    // Mark story as viewed
    markAsViewed(currentStory.id);

    // Reset progress
    setProgress(0);

    // Start progress bar
    if (!isPaused) {
      startProgress();
    }

    return () => {
      stopProgress();
    };
  }, [currentIndex, isPaused]);

  async function markAsViewed(storyId: string) {
    try {
      await supabase.rpc('mark_story_viewed', { p_story_id: storyId });
    } catch (err) {
      console.error('Error marking story as viewed:', err);
    }
  }

  function startProgress() {
    stopProgress();

    const duration = currentStory.media_type === 'image' 
      ? currentStory.duration * 1000 
      : (videoRef.current?.duration || 5) * 1000;

    const interval = 50; // Update every 50ms
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
    if (isLastStory) {
      onClose();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  function goToPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function togglePause() {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }

  function toggleMute() {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }

  function handleVideoEnded() {
    goToNext();
  }

  function handleVideoLoadedMetadata() {
    if (videoRef.current && !isPaused) {
      videoRef.current.play();
      startProgress();
    }
  }

  const photoUrl = modelStory.model_photo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${modelStory.model_photo}`
    : null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
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

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <Link 
            href={`/models/${modelStory.model_id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={modelStory.model_showname}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold border-2 border-white">
                {modelStory.model_showname.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">{modelStory.model_showname}</p>
              <p className="text-white/80 text-xs">
                {Math.floor((Date.now() - new Date(currentStory.created_at).getTime()) / 3600000)}h ago
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full max-w-lg max-h-[90vh] flex items-center justify-center">
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

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-center">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation Areas */}
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer disabled:cursor-default"
        style={{ background: 'transparent' }}
      />
      <button
        onClick={goToNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        style={{ background: 'transparent' }}
      />

      {/* Controls */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-3 z-10">
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

      {/* Navigation Arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {!isLastStory && (
        <button
          onClick={goToNext}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Views Count */}
      <div className="absolute bottom-6 left-6 text-white/80 text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {currentStory.views_count}
      </div>
    </div>
  );
}

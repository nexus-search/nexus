'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { MediaItemResponse } from '@/lib/types/api';

interface MediaViewerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
  items?: MediaItemResponse[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  mediaUrl,
  mediaType,
  onClose,
  items = [],
  currentIndex = -1,
  onNavigate
}) => {
  const canNavigate = items.length > 1 && currentIndex >= 0 && onNavigate;
  const currentIdx = currentIndex >= 0 ? currentIndex : items.findIndex(item => item.mediaUrl === mediaUrl);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (canNavigate) {
        if (e.key === 'ArrowLeft' && currentIdx > 0) {
          e.preventDefault();
          onNavigate(currentIdx - 1);
        } else if (e.key === 'ArrowRight' && currentIdx < items.length - 1) {
          e.preventDefault();
          onNavigate(currentIdx + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, canNavigate, currentIdx, items.length, onNavigate]);
  
  const handlePrevious = useCallback(() => {
    if (canNavigate && currentIdx > 0) {
      onNavigate(currentIdx - 1);
    }
  }, [canNavigate, currentIdx, onNavigate]);

  const handleNext = useCallback(() => {
    if (canNavigate && currentIdx < items.length - 1) {
      onNavigate(currentIdx + 1);
    }
  }, [canNavigate, currentIdx, items.length, onNavigate]);
  
  // Use mediaUrl if available, otherwise fall back to thumbnailUrl from current item
  const displayUrl = useMemo(() => {
    if (mediaUrl && mediaUrl.trim() !== '') {
      return mediaUrl;
    }
    // Fallback to thumbnailUrl if mediaUrl is empty
    if (currentIdx >= 0 && items[currentIdx]) {
      return items[currentIdx].thumbnailUrl || '';
    }
    return '';
  }, [mediaUrl, currentIdx, items]);

  // Don't render if we have no valid URL at all
  if (!displayUrl || displayUrl.trim() === '') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] sm:max-w-[85vw] sm:max-h-[85vh] lg:max-w-[80vw] lg:max-h-[80vh] xl:max-w-[75vw] xl:max-h-[75vh] flex items-center justify-center">
        <div className="relative w-full h-full rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-2xl ring-1 sm:ring-2 ring-white/20 bg-black/60 flex items-center justify-center">
          {mediaType === 'image' ? (
            <img
              src={displayUrl}
              alt="Full size media"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          ) : (
            <video
              src={displayUrl}
              controls
              autoPlay
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
          
          {/* Close button - more visible */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 text-white text-3xl leading-none bg-black/70 hover:bg-black/90 rounded-full w-10 h-10 sm:w-12 sm:h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
            aria-label="Close"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows */}
          {canNavigate && (
            <>
              {currentIdx > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/70 hover:bg-black/90 rounded-full w-10 h-10 sm:w-12 sm:h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {currentIdx < items.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/70 hover:bg-black/90 rounded-full w-10 h-10 sm:w-12 sm:h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 sm:p-4">
            <div className="flex items-center justify-between text-gray-200 text-xs sm:text-sm">
              <div className="flex items-center gap-2 sm:gap-4">
                {canNavigate && (
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-xs sm:text-sm">
                    {currentIdx + 1} / {items.length}
                  </span>
                )}
                <span className="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  {mediaType === 'video' ? '🎬 Video' : '🖼️ Image'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <kbd className="px-2 py-1 rounded bg-black/50 border border-white/20">Esc</kbd>
                <span>to close</span>
                {canNavigate && (
                  <>
                    <span>•</span>
                    <kbd className="px-2 py-1 rounded bg-black/50 border border-white/20">←</kbd>
                    <kbd className="px-2 py-1 rounded bg-black/50 border border-white/20">→</kbd>
                    <span>to navigate</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;

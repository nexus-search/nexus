'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAccessToken } from '@/lib/auth';
import { MediaItem } from '@/lib/types';

interface MediaViewerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
  items?: MediaItem[];
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
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const canNavigate = items.length > 1 && currentIndex >= 0 && onNavigate;
  const currentIdx = currentIndex >= 0 ? currentIndex : items.findIndex(item => item.mediaUrl === mediaUrl);
  
  // Convert backend URL to Next.js API proxy URL with auth token
  useEffect(() => {
    const getMediaUrl = (url: string) => {
      if (!url) return '';
      
      // Extract media ID from URL
      const match = url.match(/\/api\/v1\/media\/([^\/]+)\/file/);
      if (match) {
        const mediaId = match[1];
        const token = getAccessToken();
        // Use proxy route with token as query param
        if (token) {
          return `/api/media/${mediaId}?token=${encodeURIComponent(token)}`;
        }
        return `/api/media/${mediaId}`;
      }
      
      // If already absolute URL, extract ID
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const match = url.match(/\/api\/v1\/media\/([^\/]+)\/file/);
        if (match) {
          const mediaId = match[1];
          const token = getAccessToken();
          if (token) {
            return `/api/media/${mediaId}?token=${encodeURIComponent(token)}`;
          }
          return `/api/media/${mediaId}`;
        }
      }
      
      return url;
    };
    
    setProxyUrl(getMediaUrl(mediaUrl));
  }, [mediaUrl]);

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
  
  const absoluteUrl = proxyUrl || mediaUrl;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      onClick={(e) => {
        // Only close if clicking the backdrop, not the content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center">
        <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20 bg-black/60">
          {mediaType === 'image' ? (
            <img 
              src={absoluteUrl} 
              alt="Full size media" 
              className="max-w-full max-h-[95vh] w-auto h-auto object-contain"
            />
          ) : (
            <video 
              src={absoluteUrl} 
              controls 
              autoPlay 
              className="max-w-full max-h-[95vh] w-auto h-auto object-contain"
            />
          )}
          
          {/* Close button - more visible */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 text-white text-3xl leading-none bg-black/70 hover:bg-black/90 rounded-full w-12 h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/70 hover:bg-black/90 rounded-full w-12 h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
                  aria-label="Previous"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/70 hover:bg-black/90 rounded-full w-12 h-12 grid place-items-center border-2 border-white/30 hover:border-white/50 transition-all shadow-lg backdrop-blur-sm"
                  aria-label="Next"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-gray-200 text-sm">
              <div className="flex items-center gap-4">
                {canNavigate && (
                  <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                    {currentIdx + 1} / {items.length}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  {mediaType === 'video' ? '🎬 Video' : '🖼️ Image'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
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

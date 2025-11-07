'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken } from '@/lib/auth';

interface MediaViewerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ mediaUrl, mediaType, onClose }) => {
  const [proxyUrl, setProxyUrl] = useState<string>('');
  
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
  
  const absoluteUrl = proxyUrl || mediaUrl;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/40">
        {mediaType === 'image' ? (
          <img src={absoluteUrl} alt="Full size media" className="max-w-full max-h-[85vh] object-contain" />
        ) : (
          <video src={absoluteUrl} controls autoPlay className="max-w-full max-h-[85vh] object-contain" />
        )}
        <button onClick={onClose} className="absolute top-3 right-3 text-white/90 text-2xl leading-none bg-white/10 hover:bg-white/20 rounded-full w-9 h-9 grid place-items-center border border-white/10">&times;</button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-gray-200 text-sm">Press Esc to close • Arrow keys to navigate (soon)</div>
      </div>
    </div>
  );
};

export default MediaViewer;

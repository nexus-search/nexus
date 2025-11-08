
'use client';

import React, { useState, useEffect } from 'react';
import { getAccessToken } from '@/lib/auth';

interface MediaCardProps {
  mediaUrl: string;
  thumbnailUrl: string;
  similarityScore?: number;
  mediaType: 'image' | 'video';
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ mediaUrl, thumbnailUrl, similarityScore, mediaType, onClick }) => {
  const score = similarityScore != null ? `${Math.round(similarityScore * 100)}%` : undefined;
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  
  // Convert backend URL to Next.js API proxy URL with auth token
  useEffect(() => {
    const getImageUrl = (url: string) => {
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
    
    setImageSrc(getImageUrl(thumbnailUrl || mediaUrl));
  }, [thumbnailUrl, mediaUrl]);
  
  return (
    <div className="relative group rounded-xl overflow-hidden cursor-pointer bg-gray-900 ring-1 ring-white/10 hover:ring-violet-400/50 transition-all duration-300" onClick={onClick}>
      <div className="relative w-full h-48 bg-gray-800">
        {mediaType === 'video' ? (
          <div className="relative w-full h-full">
            {imageSrc && !imageError ? (
              <img 
                src={imageSrc} 
                alt="Video thumbnail" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                onError={() => setImageError(true)}
              />
            ) : (
              <video 
                src={imageSrc || mediaUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                onLoadedMetadata={(e) => {
                  // Try to capture first frame as thumbnail
                  const video = e.currentTarget;
                  video.currentTime = 0.1;
                }}
              />
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <>
            {imageSrc && !imageError ? (
              <img 
                src={imageSrc} 
                alt="Media thumbnail" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-500">
                <span>Thumbnail preview</span>
              </div>
            )}
          </>
        )}
      </div>
      {score && (
        <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm border border-white/10">
          {score}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white text-sm">
          <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">{mediaType}</span>
          <span className="underline underline-offset-4">View</span>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;

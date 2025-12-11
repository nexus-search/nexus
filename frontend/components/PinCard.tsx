"use client";
import { useState } from 'react';
import type { MediaItemResponse } from '@/lib/types/api';
import Image from 'next/image';

interface PinCardProps {
  item: MediaItemResponse;
  onClick: () => void;
  onSaveClick?: (item: MediaItemResponse) => void;
}

export default function PinCard({ item, onClick, onSaveClick }: PinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use thumbnail for grid, full image for modal
  const imageUrl = item.thumbnailUrl || item.mediaUrl || '/placeholder.png';

  return (
    <div
      className="group relative bg-gray-900/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 border border-white/5 hover:border-purple-500/30"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 animate-pulse" />
        )}

        {imageError ? (
          <div className="aspect-square flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={item.title || 'Media item'}
            className={`w-full h-auto object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Title */}
            {item.title && (
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {item.title}
              </h3>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-white/20 backdrop-blur-sm rounded-full text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          {onSaveClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveClick(item);
              }}
              className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Save to collection"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>

        {/* Media Type Badge */}
        {item.mediaType === 'video' && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            Video
          </div>
        )}
      </div>
    </div>
  );
}

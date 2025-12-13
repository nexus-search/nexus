"use client";
import { useState } from 'react';
import type { MediaItemResponse } from '@/lib/types/api';

interface PinCardProps {
  item: MediaItemResponse;
  onClick: () => void;
  onSaveClick?: (item: MediaItemResponse) => void;
  onRemoveClick?: (item: MediaItemResponse) => void;
  onDeleteClick?: (item: MediaItemResponse) => void;
  onEditClick?: (item: MediaItemResponse) => void;
}

export default function PinCard({ item, onClick, onSaveClick, onRemoveClick, onDeleteClick, onEditClick }: PinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);

  // Use thumbnail for grid
  const imageUrl = item.thumbnailUrl || item.mediaUrl || '/placeholder.png';

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const dimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
    console.log(`Image loaded: ${item.title?.substring(0, 20)} - Natural size: ${dimensions.width}x${dimensions.height}`);
    setImageDimensions(dimensions);
    setImageLoaded(true);
  };

  // Calculate aspect ratio for proper display
  const aspectRatio = imageDimensions
    ? (imageDimensions.height / imageDimensions.width) * 100
    : 150; // default to 150% (3:2 aspect ratio) while loading

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-zoom-in transition-all duration-300 hover:brightness-95 bg-white break-inside-avoid"
      style={{ boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none' }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative w-full">
        {imageError ? (
          <div className="w-full bg-gray-100 flex items-center justify-center" style={{ paddingTop: '100%', position: 'relative' }}>
            <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 p-8">
              <div>
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full" style={{ paddingTop: imageLoaded ? `${aspectRatio}%` : '150%' }}>
            {/* Skeleton - only shown while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
            )}

            {/* Actual image - positioned absolutely to respect aspect ratio */}
            <img
              src={imageUrl}
              alt={item.title || 'Pin'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}

        {/* Hover Overlay - Pinterest Style */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Action Buttons - Top Right */}
          {(onSaveClick || onRemoveClick || onDeleteClick || onEditClick) && (
            <div className="absolute top-3 right-3 flex gap-2">
              {onSaveClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveClick(item);
                  }}
                  className="px-4 py-2 bg-[#e60023] hover:bg-[#ad081b] rounded-full text-white text-sm font-semibold shadow-lg transition-colors"
                  aria-label="Save"
                >
                  Save
                </button>
              )}
              {onRemoveClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveClick(item);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 rounded-full text-white text-sm font-semibold shadow-lg transition-colors"
                  aria-label="Remove"
                >
                  Remove
                </button>
              )}
              {onEditClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(item);
                  }}
                  className="w-9 h-9 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors flex items-center justify-center"
                  aria-label="Edit"
                  title="Edit"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDeleteClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(item);
                  }}
                  className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-colors flex items-center justify-center"
                  aria-label="Delete"
                  title="Delete"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Bottom Content */}
          {(item.title || item.description || (item.tags && item.tags.length > 0)) && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              {/* Title */}
              {item.title && (
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {item.title}
                </h3>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-white/30 backdrop-blur-sm rounded-full text-white font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Media Type Badge */}
        {item.mediaType === 'video' && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            Video
          </div>
        )}
      </div>
    </div>
  );
}

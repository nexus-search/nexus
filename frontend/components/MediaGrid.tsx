
import React from 'react';
import MediaCard from './MediaCard';
import { MediaItem } from '@/lib/types';

interface MediaGridProps {
  items?: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({ items = [], onItemClick }) => {
  console.log('MediaGrid component rendered');
  if (!items.length) {
    return (
      <div className="bg-gray-700 p-6 rounded-lg mt-4 text-center text-gray-300">
        No results yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {items.map((m) => (
        <MediaCard
          key={m.id}
          mediaUrl={m.mediaUrl}
          thumbnailUrl={m.thumbnailUrl || m.mediaUrl}
          similarityScore={m.similarityScore}
          mediaType={m.mediaType}
          onClick={() => onItemClick?.(m)}
        />
      ))}
    </div>
  );
};

export default MediaGrid;


import React from 'react';
import Image from 'next/image';

interface MediaCardProps {
  mediaUrl: string;
  thumbnailUrl: string;
  similarityScore?: number;
  mediaType: 'image' | 'video';
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ mediaUrl, thumbnailUrl, similarityScore, mediaType, onClick }) => {
  console.log('MediaCard component rendered');
  const score = similarityScore != null ? `${Math.round(similarityScore * 100)}%` : undefined;
  return (
    <div className="relative group rounded-xl overflow-hidden cursor-pointer bg-gray-900 ring-1 ring-white/10 hover:ring-violet-400/50 transition-all duration-300" onClick={onClick}>
      <div className="relative w-full h-48">
        <Image src={thumbnailUrl} alt="Media thumbnail" fill className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" />
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


import React from 'react';

interface MediaCardProps {
  mediaUrl: string;
  thumbnailUrl: string;
  similarityScore?: number;
  mediaType: 'image' | 'video';
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ mediaUrl, thumbnailUrl, similarityScore, mediaType, onClick }) => {
  console.log('MediaCard component rendered');
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer" onClick={onClick}>
      <img src={thumbnailUrl} alt="Media thumbnail" className="w-full h-48 object-cover" />
      <div className="p-4">
        <p className="text-white">Similarity: {similarityScore ? `${(similarityScore * 100).toFixed(2)}%` : 'N/A'}</p>
      </div>
    </div>
  );
};

export default MediaCard;

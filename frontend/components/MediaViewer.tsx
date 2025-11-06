
import React from 'react';

interface MediaViewerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ mediaUrl, mediaType, onClose }) => {
  console.log('MediaViewer component rendered');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative">
        {mediaType === 'image' ? (
          <img src={mediaUrl} alt="Full size media" className="max-w-full max-h-full" />
        ) : (
          <video src={mediaUrl} controls autoPlay className="max-w-full max-h-full" />
        )}
        <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl">&times;</button>
      </div>
    </div>
  );
};

export default MediaViewer;

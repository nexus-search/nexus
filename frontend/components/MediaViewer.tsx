
import React from 'react';

interface MediaViewerProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ mediaUrl, mediaType, onClose }) => {
  console.log('MediaViewer component rendered');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/40">
        {mediaType === 'image' ? (
          <img src={mediaUrl} alt="Full size media" className="max-w-full max-h-[85vh] object-contain" />
        ) : (
          <video src={mediaUrl} controls autoPlay className="max-w-full max-h-[85vh] object-contain" />
        )}
        <button onClick={onClose} className="absolute top-3 right-3 text-white/90 text-2xl leading-none bg-white/10 hover:bg-white/20 rounded-full w-9 h-9 grid place-items-center border border-white/10">&times;</button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-gray-200 text-sm">Press Esc to close • Arrow keys to navigate (soon)</div>
      </div>
    </div>
  );
};

export default MediaViewer;

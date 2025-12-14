"use client";
import { useState, useEffect } from 'react';
import { mediaService } from '@/lib/services/media.service';
import type { MediaItemResponse } from '@/lib/types/api';
import toast from 'react-hot-toast';

interface EditMediaModalProps {
  media: MediaItemResponse;
  onClose: () => void;
  onUpdated: (updated: MediaItemResponse) => void;
}

export default function EditMediaModal({
  media,
  onClose,
  onUpdated,
}: EditMediaModalProps) {
  const [title, setTitle] = useState(media.title || '');
  const [description, setDescription] = useState(media.description || '');
  const [tags, setTags] = useState(media.tags?.join(', ') || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(media.visibility as 'public' | 'private' || 'public');
  const [updating, setUpdating] = useState(false);

  const handleSave = async () => {
    const toastId = toast.loading('Updating pin...');

    try {
      setUpdating(true);
      const updated = await mediaService.updateMedia(media.id, {
        title,
        description,
        tags,
        visibility,
      });

      toast.success('Pin updated!', { id: toastId });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update media:', err);
      toast.error(err.message || 'Failed to update pin', { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Edit Pin</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Image */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={media.thumbnailUrl || media.mediaUrl}
              alt={media.title || 'Media preview'}
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell everyone what your pin is about"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separate tags with commas (e.g. nature, landscape, mountains)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setVisibility('public')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  visibility === 'public'
                    ? 'border-[#e60023] bg-red-50 text-[#e60023]'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">Public</span>
                </div>
                <p className="text-xs mt-1">Anyone can see this pin</p>
              </button>
              <button
                onClick={() => setVisibility('private')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  visibility === 'private'
                    ? 'border-[#e60023] bg-red-50 text-[#e60023]'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold">Private</span>
                </div>
                <p className="text-xs mt-1">Only you can see this pin</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={updating}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updating}
            className="px-6 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

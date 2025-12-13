"use client";
import { useState, useEffect } from 'react';
import { collectionService } from '@/lib/services/collection.service';
import type { CollectionResponse } from '@/lib/types/api';
import toast from 'react-hot-toast';

interface SaveToCollectionModalProps {
  mediaId: string;
  mediaTitle?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaveToCollectionModal({
  mediaId,
  mediaTitle,
  onClose,
  onSaved,
}: SaveToCollectionModalProps) {
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionResponse[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  // Debounced search filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      const next = q
        ? collections.filter((c) => c.name.toLowerCase().includes(q))
        : collections;
      setFilteredCollections(next);
      setVisibleCount(12);
      setShowAutocomplete(!!q);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery, collections]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionService.getAll();
      setCollections(data);
      setFilteredCollections(data);
    } catch (err: any) {
      console.error('Failed to load collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCollection = async (collectionId: string) => {
    const toastId = toast.loading('Saving to board...');
    try {
      setSaving(true);
      setError('');
      await collectionService.addMedia(collectionId, [mediaId]);
      toast.success('Saved to board!', { id: toastId });
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to save to collection:', err);
      toast.error(err.message || 'Failed to save to board', { id: toastId });
      setError(err.message || 'Failed to save to collection');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Board name is required');
      setError('Collection name is required');
      return;
    }

    const toastId = toast.loading('Creating board...');
    try {
      setSaving(true);
      setError('');
      const newCollection = await collectionService.create({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
      });
      await collectionService.addMedia(newCollection.id, [mediaId]);
      toast.success('Board created and pin saved!', { id: toastId });
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to create collection:', err);
      toast.error(err.message || 'Failed to create board', { id: toastId });
      setError(err.message || 'Failed to create collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Save to Board</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {mediaTitle && (
            <p className="text-sm text-gray-500 mt-1 truncate">{mediaTitle}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#e60023] rounded-full animate-spin" />
            </div>
          ) : showCreateNew ? (
            /* Create New Collection Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Name *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Travel Ideas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="What's this board about?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateAndSave}
                  disabled={saving || !newCollectionName.trim()}
                  className="flex-1 px-4 py-2 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Creating...' : 'Create & Save'}
                </button>
                <button
                  onClick={() => setShowCreateNew(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Collection List */
            <div className="space-y-2">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search boards..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
                  onFocus={() => setShowAutocomplete(!!searchQuery.trim())}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                />
                {showAutocomplete && filteredCollections.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredCollections.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(c.name);
                          setShowAutocomplete(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Create New Button */}
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#e60023] hover:bg-red-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-[#e60023] flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-[#e60023]">
                  Create new board
                </span>
              </button>

              {/* Existing Collections with limit */}
              {filteredCollections.length > 0 ? (
                filteredCollections.slice(0, visibleCount).map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleSaveToCollection(collection.id)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50 border border-gray-200 hover:border-[#e60023]"
                  >
                    {collection.coverImageUrl ? (
                      <img
                        src={collection.coverImageUrl}
                        alt={collection.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{collection.name}</p>
                      <p className="text-sm text-gray-500">{collection.mediaCount} pins</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No boards yet. Create your first one!
                </p>
              )}

              {/* Show More */}
              {filteredCollections.length > visibleCount && (
                <div className="pt-2">
                  <button
                    onClick={() => setVisibleCount((v) => v + 12)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Show more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

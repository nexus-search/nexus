"use client";
import Header from '@/components/Header';
import MediaViewer from '@/components/MediaViewer';
import { useState, useEffect, use } from 'react';
import { getMedia, deleteMedia, getCollections, addMediaToCollection } from '@/lib/api';
import { MediaItem, Collection } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMediaFile } from '@/lib/api';

type MediaPageProps = {
  params: Promise<{ id: string }>;
};

export default function MediaPage({ params }: MediaPageProps) {
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    loadMedia();
    loadCollections();
  }, [isAuthenticated, id]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await getMedia(id);
      setMedia(mediaData);
    } catch (error: any) {
      console.error('Failed to load media:', error);
      if (error.message?.includes('404')) {
        router.push('/library');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const res = await getCollections();
      setCollections(res.collections);
    } catch (error: any) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) return;
    try {
      await deleteMedia(id);
      router.push('/library');
    } catch (error: any) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete media: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection) {
      alert('Please select a collection');
      return;
    }
    try {
      await addMediaToCollection(selectedCollection, [id]);
      setShowAddToCollection(false);
      setSelectedCollection('');
      alert('Media added to collection successfully!');
    } catch (error: any) {
      console.error('Failed to add to collection:', error);
      alert('Failed to add to collection: ' + (error.message || 'Unknown error'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="relative bg-gray-950 min-h-screen flex flex-col">
        <Header />
        <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading media...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="relative bg-gray-950 min-h-screen flex flex-col">
        <Header />
        <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">Media not found</h2>
            <Link
              href="/library"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              Back to Library
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?.userId === media.ownerId;

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col">
      <Header />
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href="/library"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Library
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Viewer */}
          <div className="relative">
            <div className="sticky top-8">
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10">
                <MediaViewer
                  mediaUrl={media.mediaUrl}
                  mediaType={media.mediaType}
                  onClose={() => {}}
                />
              </div>
            </div>
          </div>

          {/* Media Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{media.filename}</h1>
              <div className="flex items-center gap-3 mb-4">
                {media.visibility === 'public' ? (
                  <span className="px-3 py-1 text-sm rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Public
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Private
                  </span>
                )}
                <span className="px-3 py-1 text-sm rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {media.mediaType === 'image' ? '🖼️ Image' : '🎬 Video'}
                </span>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-900 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">File Size</span>
                  <span className="text-white">{formatFileSize(media.fileSize || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Date</span>
                  <span className="text-white">{formatDate(media.uploadDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Media Type</span>
                  <span className="text-white capitalize">{media.mediaType}</span>
                </div>
                {media.tags && media.tags.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {media.tags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isOwner && (
              <div className="bg-gray-900 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddToCollection(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                  >
                    Add to Collection
                  </button>
                  <a
                    href={getMediaFile(id)}
                    download={media.filename}
                    className="block w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all font-medium text-center"
                  >
                    Download
                  </a>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-3 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all font-medium border border-red-500/30"
                  >
                    Delete Media
                  </button>
                </div>
              </div>
            )}

            {/* Similar Media Suggestions */}
            <div className="bg-gray-900 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Similar Media</h2>
              <p className="text-gray-400 text-sm">
                Use the search feature to find similar media.
              </p>
              <Link
                href={`/search/media`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                Search Similar
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Add to Collection Modal */}
      {showAddToCollection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Add to Collection</h2>
            {collections.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Select Collection</label>
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="">Choose a collection...</option>
                    {collections.map((collection) => (
                      <option key={collection.id || collection.collectionId} value={collection.id || collection.collectionId}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCollection}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddToCollection(false);
                      setSelectedCollection('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-4">
                  You don't have any collections yet. Create one to organize your media.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/collections"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-center"
                  >
                    Create Collection
                  </Link>
                  <button
                    onClick={() => {
                      setShowAddToCollection(false);
                      setSelectedCollection('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

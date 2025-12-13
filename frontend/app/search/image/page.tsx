"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import MediaViewer from '@/components/MediaViewer';
import SaveToCollectionModal from '@/components/SaveToCollectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { searchService } from '@/lib/services/search.service';
import type { MediaItemResponse } from '@/lib/types/api';

export default function ImageSearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [results, setResults] = useState<MediaItemResponse[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [saveModalMedia, setSaveModalMedia] = useState<MediaItemResponse | null>(null);

  const pageSize = 20;

  // Require authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit for search
      setError('Image size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResults([]);
    setPage(1);
    setTotal(0);
    setHasMore(false);

    // Generate preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSearch = async () => {
    if (!file) return;

    setSearching(true);
    setError('');

    try {
      const res = await searchService.searchByImage({
        file: file,
        scope: 'public',
        page: 1,
        pageSize,
      });

      setResults(res.items);
      if (res.total !== undefined) setTotal(res.total);

      // Use backend's has_more flag
      setHasMore(res.has_more);
      setPage(2);

      console.log(`Image search - Page 1: Loaded ${res.items.length} items. Total: ${res.total}. Has more: ${res.has_more}`);
    } catch (err: any) {
      console.error('Image search failed:', err);
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const fetchPage = async (pageNum: number) => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await searchService.searchByImage({
        file: file,
        scope: 'public',
        page: pageNum,
        pageSize,
      });

      // Calculate new total before updating state
      const currentResultsCount = results.length;
      const newTotalItems = currentResultsCount + res.items.length;

      // Append new items
      setResults(prev => [...prev, ...res.items]);

      // Update total
      if (res.total !== undefined) setTotal(res.total);

      // Use backend's has_more flag
      setHasMore(res.has_more);
      setPage(pageNum + 1);

      console.log(`Image search - Page ${pageNum}: Loaded ${res.items.length} items. Total loaded: ${newTotalItems}/${res.total}. Has more: ${res.has_more}`);
    } catch (e) {
      console.error('Load more failed', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-4 pt-24 pb-12">
        {/* Upload Section */}
        {!results.length && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3">Search by Image</h1>
              <p className="text-gray-600">Upload an image to find similar pins</p>
            </div>

            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-colors ${
                dragActive
                  ? 'border-[#e60023] bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-6">
                  <div className="relative max-w-md mx-auto">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full rounded-lg shadow-lg"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        setResults([]);
                        setError('');
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="w-full max-w-md mx-auto block px-6 py-4 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    {searching ? 'Searching...' : 'Find Similar Images'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Choose an image
                  </p>
                  <p className="text-gray-500 mb-6">
                    Or drag and drop it here
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] transition-colors shadow-lg"
                  >
                    Select Image
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Initial Loading Skeleton */}
        {searching && results.length === 0 && (
          <div className="w-full">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-spin h-6 w-6 border-3 border-[#e60023] border-t-transparent rounded-full"></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Searching for similar images...</h2>
              </div>
              {previewUrl && (
                <div className="flex items-center gap-4">
                  <img src={previewUrl} alt="Search query" className="w-20 h-20 rounded-lg object-cover border-2 border-[#e60023]" />
                  <p className="text-gray-600">Finding visually similar content</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 sm:gap-4">
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <div key={colIdx} className="flex-1 flex flex-col gap-3 sm:gap-4">
                  {Array.from({ length: 3 }).map((_, rowIdx) => (
                    <div key={rowIdx} className="animate-pulse">
                      <div
                        className="bg-gray-100 rounded-2xl overflow-hidden"
                        style={{ height: `${200 + ((colIdx + rowIdx) % 3) * 80}px` }}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  {previewUrl && (
                    <img src={previewUrl} alt="Search query" className="w-16 h-16 rounded-lg object-cover border-2 border-[#e60023]" />
                  )}
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Similar Images</h2>
                    <p className="text-gray-600">
                      Found {total.toLocaleString()} similar {total === 1 ? 'result' : 'results'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setResults([]);
                  setError('');
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                New Search
              </button>
            </div>

            <MasonryGrid
              items={results}
              onLoadMore={() => {
                if (!loading && hasMore) {
                  fetchPage(page);
                }
              }}
              hasMore={hasMore}
              loading={loading}
              onItemClick={(item) => {
                const idx = results.findIndex(i => i.id === item.id);
                setSelectedItemIndex(idx);
              }}
              onSaveClick={setSaveModalMedia}
            />
          </div>
        )}
      </main>

      {/* MediaViewer Modal */}
      {selectedItemIndex >= 0 && results[selectedItemIndex] && (
        <MediaViewer
          mediaUrl={results[selectedItemIndex].mediaUrl || results[selectedItemIndex].thumbnailUrl || ''}
          mediaType={results[selectedItemIndex].mediaType}
          onClose={() => setSelectedItemIndex(-1)}
          items={results}
          currentIndex={selectedItemIndex}
          onNavigate={(idx) => setSelectedItemIndex(idx)}
        />
      )}

      {/* Save to Collection Modal */}
      {saveModalMedia && (
        <SaveToCollectionModal
          mediaId={saveModalMedia.id}
          onClose={() => setSaveModalMedia(null)}
          onSaved={() => setSaveModalMedia(null)}
        />
      )}
    </div>
  );
}

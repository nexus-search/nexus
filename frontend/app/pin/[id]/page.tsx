"use client";
import { useEffect, useState, use } from 'react';
import Header from '@/components/Header';
import MediaViewer from '@/components/MediaViewer';
import { mediaService } from '@/lib/services/media.service';
import { searchService } from '@/lib/services/search.service';
import type { MediaItemResponse } from '@/lib/types/api';
import Link from 'next/link';

type PinPageProps = {
  params: Promise<{ id: string }>;
};

export default function PinPage({ params }: PinPageProps) {
  const { id } = use(params);
  const [media, setMedia] = useState<MediaItemResponse | null>(null);
  const [similar, setSimilar] = useState<MediaItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const item = await mediaService.getById(id);
        setMedia(item);
        // Fetch similar media (authenticated endpoint, best-effort)
        try {
          const res = await searchService.findSimilar(id);
          setSimilar(res.items || []);
        } catch (e) {
          console.warn('Similar fetch skipped:', e);
        }
      } catch (e) {
        console.error('Failed to load pin', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 pt-24">
        {loading && (
          <div className="text-center py-16 text-gray-500">Loading pin…</div>
        )}

        {!loading && !media && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2">Pin not found</h2>
            <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
          </div>
        )}

        {media && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <MediaViewer mediaUrl={media.mediaUrl} mediaType={media.mediaType} onClose={() => {}} />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{media.title || media.filename}</h1>
              {media.description && <p className="text-gray-600">{media.description}</p>}
              {media.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {media.tags.map((t, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              {/* Similar items */}
              {similar.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-semibold mb-3">More like this</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {similar.slice(0, 9).map((s) => (
                      <Link key={s.id} href={`/pin/${s.id}`} className="block">
                        <img src={s.thumbnailUrl || s.mediaUrl} alt={s.title || 'Similar'} className="w-full h-auto rounded-lg" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

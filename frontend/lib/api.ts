import { MediaItem, UploadResponse, SearchResults } from './types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function uploadMedia(file: File): Promise<UploadResponse> {
  console.log('mock uploadMedia', file.name);
  await delay(600);
  return { id: `upl_${Math.random().toString(36).slice(2, 8)}` };
}

export async function searchSimilar(file: File, threshold?: number): Promise<SearchResults> {
  console.log('mock searchSimilar', file.name, threshold);
  await delay(800);
  const queryId = `qry_${Math.random().toString(36).slice(2, 8)}`;
  const items: MediaItem[] = Array.from({ length: 9 }).map((_, i) => ({
    id: `m_${i}`,
    mediaUrl: `https://picsum.photos/seed/${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`,
    mediaType: 'image',
    similarityScore: Math.max(0, 1 - i * 0.07),
  }));
  return { queryId, items };
}

export async function getMedia(id: string): Promise<MediaItem> {
  console.log('mock getMedia', id);
  await delay(300);
  return {
    id,
    mediaUrl: `https://picsum.photos/seed/${id}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${id}/400/300`,
    mediaType: 'image',
  };
}

export async function getSearchResults(queryId: string): Promise<SearchResults> {
  console.log('mock getSearchResults', queryId);
  await delay(500);
  const items: MediaItem[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `${queryId}_${i}`,
    mediaUrl: `https://picsum.photos/seed/${queryId}_${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${queryId}_${i}/400/300`,
    mediaType: 'image',
    similarityScore: Math.max(0, 1 - i * 0.05),
  }));
  return { queryId, items };
}



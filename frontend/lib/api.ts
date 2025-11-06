import { MediaItem, UploadResponse, SearchResults } from './types';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const PAGE_SIZE_DEFAULT = 12;

export async function uploadMedia(file: File): Promise<UploadResponse> {
  console.log('mock uploadMedia', file.name);
  await delay(600);
  return { id: `upl_${Math.random().toString(36).slice(2, 8)}` };
}

export async function searchSimilar(file: File, threshold?: number, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  console.log('mock searchSimilar', file.name, threshold);
  await delay(800);
  const queryId = `qry_${Math.random().toString(36).slice(2, 8)}`;
  const all: MediaItem[] = Array.from({ length: 60 }).map((_, i) => ({
    id: `m_${i}`,
    mediaUrl: `https://picsum.photos/seed/${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${i}/400/300`,
    mediaType: 'image',
    similarityScore: Math.max(0, 1 - i * 0.07),
  }));
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { queryId, items, total: all.length };
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

export async function getSearchResults(queryId: string, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  console.log('mock getSearchResults', queryId, page, pageSize);
  await delay(500);
  const all: MediaItem[] = Array.from({ length: 60 }).map((_, i) => ({
    id: `${queryId}_${i}`,
    mediaUrl: `https://picsum.photos/seed/${queryId}_${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${queryId}_${i}/400/300`,
    mediaType: 'image',
    similarityScore: Math.max(0, 1 - i * 0.05),
  }));
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { queryId, items, total: all.length };
}

export async function searchByText(query: string, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  console.log('mock searchByText', query);
  await delay(700);
  const queryId = `txt_${Math.random().toString(36).slice(2, 8)}`;
  const all: MediaItem[] = Array.from({ length: 60 }).map((_, i) => ({
    id: `${queryId}_${i}`,
    mediaUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}_${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}_${i}/400/300`,
    mediaType: 'image',
    similarityScore: Math.max(0, 1 - i * 0.06),
  }));
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { queryId, items, total: all.length };
}



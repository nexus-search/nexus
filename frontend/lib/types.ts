export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  similarityScore?: number;
}

export interface UploadResponse {
  id: string;
}

export interface SearchResults {
  queryId: string;
  items: MediaItem[];
  total?: number;
}



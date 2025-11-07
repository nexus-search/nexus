import { MediaItem, UploadResponse, SearchResults, HealthStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const PAGE_SIZE_DEFAULT = 12;

async function fetchApi(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch API at ${path}`, error);
    throw error;
  }
}

export function getHealth(): Promise<HealthStatus> {
  return fetchApi('/api/v1/health');
}

export async function uploadMedia(file: File): Promise<UploadResponse> {
  console.log('uploadMedia not implemented', file.name);
  // In a real implementation, we would use FormData to send the file:
  // const formData = new FormData();
  // formData.append('file', file);
  // return fetchApi('/api/v1/upload', { method: 'POST', body: formData });
  return { id: 'not_implemented' };
}

export function searchSimilar(file: File, threshold = 0.5, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threshold', threshold.toString());
  formData.append('page', page.toString());
  formData.append('page_size', pageSize.toString());

  return fetchApi('/api/v1/search/similar', { 
    method: 'POST',
    body: formData,
  });
}

export function getMedia(id: string): Promise<MediaItem> {
  return fetchApi(`/api/v1/media/${id}`);
}

export function getSearchResults(queryId: string, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  return fetchApi(`/api/v1/search/results/${queryId}?page=${page}&page_size=${pageSize}`);
}

export function searchByText(query: string, page = 1, pageSize = PAGE_SIZE_DEFAULT): Promise<SearchResults> {
  return fetchApi(`/api/v1/search/text?query=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`);
}



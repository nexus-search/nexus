import { 
  MediaItem, 
  UploadResponse, 
  SearchResults, 
  HealthStatus,
  UserRegister,
  UserLogin,
  TokenResponse,
  User,
  Collection,
  CollectionList,
} from './types';
import { getAccessToken, getRefreshToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const PAGE_SIZE_DEFAULT = 12;

async function fetchApi(path: string, options: RequestInit = {}, requireAuth = false): Promise<any> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Add auth header if needed
  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 - try to refresh token
    if (response.status === 401 && requireAuth) {
      try {
        const newTokens = await refreshToken();
        // Retry with new token
        const retryHeaders: Record<string, string> = { ...headers };
        retryHeaders['Authorization'] = `Bearer ${newTokens.accessToken}`;
        const retryResponse = await fetch(url, { ...config, headers: retryHeaders });
        if (!retryResponse.ok) {
          const errorBody = await retryResponse.text();
          throw new Error(`API error: ${retryResponse.status} ${retryResponse.statusText} - ${errorBody}`);
        }
        return await retryResponse.json();
      } catch (refreshError) {
        // Refresh failed, clear auth
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexus_access_token');
          localStorage.removeItem('nexus_refresh_token');
        }
        throw new Error('Authentication failed. Please login again.');
      }
    }

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.detail || errorBody.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
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

// Authentication APIs
export async function register(data: UserRegister): Promise<void> {
  await fetchApi('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function login(credentials: UserLogin): Promise<TokenResponse> {
  return fetchApi('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function refreshToken(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  const tokens = await fetchApi('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  // Update stored tokens
  if (typeof window !== 'undefined') {
    localStorage.setItem('nexus_access_token', tokens.accessToken);
    localStorage.setItem('nexus_refresh_token', tokens.refreshToken);
  }
  return tokens;
}

export async function logout(): Promise<void> {
  await fetchApi('/api/v1/auth/logout', {
    method: 'POST',
  }, true);
}

export async function getCurrentUser(): Promise<User> {
  // This would need a /me endpoint, for now we'll extract from token
  // For simplicity, we'll return a placeholder
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');
  // TODO: Implement /api/v1/auth/me endpoint in backend
  return { userId: '', email: '', username: '' };
}

// Media APIs
export async function uploadMedia(
  file: File, 
  visibility: 'public' | 'private' = 'private',
  tags: string = ''
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const params = new URLSearchParams();
  params.append('visibility', visibility);
  if (tags) params.append('tags', tags);

  return fetchApi(`/api/v1/media/upload?${params.toString()}`, {
    method: 'POST',
    body: formData,
  }, true);
}

export function getMedia(id: string): Promise<MediaItem> {
  return fetchApi(`/api/v1/media/${id}`);
}

export async function getUserMedia(
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResults> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());
  return fetchApi(`/api/v1/media?${params.toString()}`, {}, true);
}

export function getMediaFile(id: string): string {
  return `${API_BASE_URL}/api/v1/media/${id}/file`;
}

export async function deleteMedia(id: string): Promise<void> {
  await fetchApi(`/api/v1/media/${id}`, {
    method: 'DELETE',
  }, true);
}

// Search APIs
export function searchSimilar(
  file: File, 
  scope: string = 'all',
  limit: number = 20,
  threshold: number = 0.5
): Promise<SearchResults> {
  const formData = new FormData();
  formData.append('file', file);
  
  const params = new URLSearchParams();
  params.append('scope', scope);
  params.append('limit', limit.toString());
  params.append('threshold', threshold.toString());

  return fetchApi(`/api/v1/search/similar?${params.toString()}`, {
    method: 'POST',
    body: formData,
  });
}

export function searchByText(
  query: string, 
  scope: string = 'all',
  page: number = 1, 
  pageSize: number = PAGE_SIZE_DEFAULT
): Promise<SearchResults> {
  const params = new URLSearchParams();
  params.append('query', query);
  params.append('scope', scope);
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());

  return fetchApi(`/api/v1/search/text?${params.toString()}`);
}

export function searchByImage(
  queryImage: string, // base64 or media_id
  scope: string = 'all',
  limit: number = 20
): Promise<SearchResults> {
  return fetchApi('/api/v1/search/by-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryImage,
      scope,
      limit,
    }),
  });
}

// Collection APIs
export async function getCollections(userId?: string): Promise<CollectionList> {
  const params = userId ? `?userId=${userId}` : '';
  return fetchApi(`/api/v1/collections${params}`, {}, true);
}

export async function getCollection(collectionId: string): Promise<Collection> {
  return fetchApi(`/api/v1/collections/${collectionId}`, {}, true);
}

export async function createCollection(
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<Collection> {
  return fetchApi('/api/v1/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, isPublic }),
  }, true);
}

export async function updateCollection(
  collectionId: string,
  name?: string,
  description?: string,
  isPublic?: boolean
): Promise<Collection> {
  return fetchApi(`/api/v1/collections/${collectionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, isPublic }),
  }, true);
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await fetchApi(`/api/v1/collections/${collectionId}`, {
    method: 'DELETE',
  }, true);
}

export async function addMediaToCollection(
  collectionId: string,
  mediaIds: string[]
): Promise<{ added: number; message: string }> {
  return fetchApi(`/api/v1/collections/${collectionId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaIds }),
  }, true);
}

export async function removeMediaFromCollection(
  collectionId: string,
  mediaId: string
): Promise<void> {
  await fetchApi(`/api/v1/collections/${collectionId}/media/${mediaId}`, {
    method: 'DELETE',
  }, true);
}



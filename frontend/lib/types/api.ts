/**
 * API types and interfaces
 * These types match the backend response schemas
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface MediaItemResponse {
  id: string;
  filename: string;
  mediaUrl: string;
  thumbnailUrl: string;
  mediaType: 'image' | 'video';
  similarityScore?: number;
  fileSize: number;
  uploadDate: string;
  tags: string[];
  visibility: 'public' | 'private';
  ownerId: string;
  title?: string;
  description?: string;
}

export interface UploadResponse {
  mediaId: string;
  filename: string;
  fileSize: number;
  visibility: string;
  uploadDate: string;
  embeddingStatus: string;
  mediaUrl: string;
  thumbnailUrl: string;
}

export interface SearchResponse {
  queryId: string;
  items: MediaItemResponse[];
  total?: number;
  searchTimeMs?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
}

export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  mediaCount: number;
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;
  coverImageId?: string;
  coverImageUrl?: string;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

// Request types
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UploadMediaRequest {
  file: File;
  title?: string;
  description?: string;
  tags?: string;
  visibility?: 'public' | 'private';
}

export interface SearchTextRequest {
  query: string;
  scope?: SearchScope;
  collectionId?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchImageRequest {
  file: File;
  scope?: SearchScope;
  collectionId?: string;
  topK?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImageId?: string;
}

export type SearchScope = 'public' | 'library' | 'favorites' | 'collection';

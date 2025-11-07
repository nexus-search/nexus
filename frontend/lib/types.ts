export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  filename?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: MediaType;
  similarityScore?: number;
  fileSize?: number;
  uploadDate?: string;
  tags?: string[];
  visibility?: string;
  ownerId?: string;
}

export interface UploadResponse {
  mediaId: string;
  filename: string;
  fileSize: number;
  visibility: string;
  uploadDate: string;
  embeddingStatus: string;
}

export interface SearchResults {
  queryId: string;
  items: MediaItem[];
  total?: number;
  searchTimeMs?: number;
}

export interface ServiceStatus {
  status: string;
}

export interface HealthStatus {
  status: string;
  elasticsearch: ServiceStatus;
  mongodb: ServiceStatus;
  model: ServiceStatus;
}

// Authentication Types
export interface UserRegister {
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface User {
  userId: string;
  email: string;
  username: string;
}

// Collection Types
export interface Collection {
  id: string;
  collectionId?: string; // For backward compatibility
  name: string;
  description?: string;
  mediaCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isPublic?: boolean;
}

export interface CollectionList {
  collections: Collection[];
}



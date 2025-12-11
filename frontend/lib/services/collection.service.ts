/**
 * Collection service
 * Handles collection CRUD and media management
 */

import { get, post, put, patch, del } from '../utils/api-client';
import type {
  CollectionResponse,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  PaginatedResponse,
  MediaItemResponse,
  MessageResponse,
} from '../types/api';

class CollectionService {
  /**
   * Get all collections for current user
   */
  async getAll(): Promise<CollectionResponse[]> {
    return get<CollectionResponse[]>('/api/v1/collections', {
      requireAuth: true,
    });
  }

  /**
   * Get collection by ID
   */
  async getById(id: string): Promise<CollectionResponse> {
    return get<CollectionResponse>(`/api/v1/collections/${id}`, {
      requireAuth: true,
    });
  }

  /**
   * Create a new collection
   */
  async create(data: CreateCollectionRequest): Promise<CollectionResponse> {
    return post<CollectionResponse>(
      '/api/v1/collections',
      data,
      { requireAuth: true }
    );
  }

  /**
   * Update collection metadata
   */
  async update(id: string, data: UpdateCollectionRequest): Promise<CollectionResponse> {
    return patch<CollectionResponse>(
      `/api/v1/collections/${id}`,
      data,
      { requireAuth: true }
    );
  }

  /**
   * Delete a collection
   */
  async delete(id: string): Promise<MessageResponse> {
    return del<MessageResponse>(`/api/v1/collections/${id}`, { requireAuth: true });
  }

  /**
   * Get media items in a collection
   */
  async getMedia(
    collectionId: string,
    params: { page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResponse<MediaItemResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());

    const endpoint = `/api/v1/collections/${collectionId}/media${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return get<PaginatedResponse<MediaItemResponse>>(endpoint, { requireAuth: true });
  }

  /**
   * Add media to collection
   */
  async addMedia(collectionId: string, mediaIds: string[]): Promise<MessageResponse> {
    return post<MessageResponse>(
      `/api/v1/collections/${collectionId}/media`,
      { mediaIds },
      { requireAuth: true }
    );
  }

  /**
   * Remove media from collection
   */
  async removeMedia(collectionId: string, mediaId: string): Promise<MessageResponse> {
    return del<MessageResponse>(
      `/api/v1/collections/${collectionId}/media/${mediaId}`,
      { requireAuth: true }
    );
  }

  /**
   * Set collection cover image
   */
  async setCoverImage(collectionId: string, mediaId: string): Promise<CollectionResponse> {
    return this.update(collectionId, { coverImageId: mediaId });
  }
}

export const collectionService = new CollectionService();

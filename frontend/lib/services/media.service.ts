/**
 * Media service
 * Handles media upload, retrieval, and management
 */

import { get, post, del } from '../utils/api-client';
import type {
  MediaItemResponse,
  UploadResponse,
  UploadMediaRequest,
  PaginatedResponse,
  MessageResponse,
} from '../types/api';

class MediaService {
  /**
   * Upload a new media file
   */
  async upload(request: UploadMediaRequest): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    // Build query params
    const params = new URLSearchParams();
    if (request.title) params.append('title', request.title);
    if (request.description) params.append('description', request.description);
    if (request.tags) params.append('tags', request.tags);
    if (request.visibility) params.append('visibility', request.visibility);

    const endpoint = `/api/v1/media/upload${params.toString() ? '?' + params.toString() : ''}`;

    return post<UploadResponse>(endpoint, formData, { requireAuth: true });
  }

  /**
   * Get media item by ID
   */
  async getById(id: string): Promise<MediaItemResponse> {
    return get<MediaItemResponse>(`/api/v1/media/${id}`, { requireAuth: false });
  }

  /**
   * Get media file URL (redirects to Cloudinary)
   */
  getFileUrl(id: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}/api/v1/media/${id}/file`;
  }

  /**
   * List all public media with pagination (no auth required)
   */
  async listMedia(params: {
    page?: number;
    pageSize?: number;
    visibility?: 'public' | 'private';
  } = {}): Promise<PaginatedResponse<MediaItemResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());
    // Public feed endpoint (no auth)
    const endpoint = `/api/v1/media/public${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return get<PaginatedResponse<MediaItemResponse>>(endpoint, { requireAuth: false });
  }

  /**
   * List user's media with pagination
   */
  async getUserMedia(params: {
    page?: number;
    pageSize?: number;
    visibility?: 'public' | 'private';
  } = {}): Promise<PaginatedResponse<MediaItemResponse>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());
    if (params.visibility) queryParams.append('visibility', params.visibility);

    const endpoint = `/api/v1/media${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return get<PaginatedResponse<MediaItemResponse>>(endpoint, { requireAuth: true });
  }

  /**
   * List user's media with pagination (convenience method)
   */
  async listUserMedia(page: number = 1, pageSize: number = 20, visibility?: 'public' | 'private'): Promise<PaginatedResponse<MediaItemResponse>> {
    return this.getUserMedia({ page, pageSize, visibility });
  }

  /**
   * Delete a media item
   */
  async deleteMedia(id: string): Promise<MessageResponse> {
    return del<MessageResponse>(`/api/v1/media/${id}`, { requireAuth: true });
  }

  /**
   * Delete a media item (alias for deleteMedia)
   */
  async delete(id: string): Promise<MessageResponse> {
    return this.deleteMedia(id);
  }

  /**
   * Batch delete media items
   */
  async batchDelete(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.delete(id)));
  }
}

export const mediaService = new MediaService();

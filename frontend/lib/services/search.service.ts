/**
 * Search service
 * Handles text and image-based search
 */

import { get, post } from '../utils/api-client';
import type {
  SearchTextRequest,
  SearchImageRequest,
  PaginatedResponse,
  MediaItemResponse,
  SearchScope,
} from '../types/api';

class SearchService {
  /**
   * Search by text query
   */
  async searchByText(request: SearchTextRequest): Promise<PaginatedResponse<MediaItemResponse>> {
    const params = new URLSearchParams();
    params.append('query', request.query);
    if (request.scope) params.append('scope', request.scope);
    if (request.collectionId) params.append('collection_id', request.collectionId);
    if (request.page) params.append('page', request.page.toString());
    if (request.pageSize) params.append('page_size', request.pageSize.toString());

    const endpoint = `/api/v1/use/search/text?${params.toString()}`;

    return post<PaginatedResponse<MediaItemResponse>>(endpoint, undefined, { requireAuth: true });
  }

  /**
   * Search by image upload
   */
  async searchByImage(request: SearchImageRequest): Promise<PaginatedResponse<MediaItemResponse>> {
    const formData = new FormData();
    formData.append('file', request.file);

    const params = new URLSearchParams();
    if (request.scope) params.append('scope', request.scope);
    if (request.collectionId) params.append('collection_id', request.collectionId);
    if (request.topK) params.append('top_k', request.topK.toString());
    if (request.page) params.append('page', request.page.toString());
    if (request.pageSize) params.append('page_size', request.pageSize.toString());

    const endpoint = `/api/v1/use/search/image${params.toString() ? '?' + params.toString() : ''}`;

    return post<PaginatedResponse<MediaItemResponse>>(endpoint, formData, { requireAuth: true });
  }

  /**
   * Find similar media to a given media item
   */
  async findSimilar(mediaId: string, topK: number = 10, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<MediaItemResponse>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const endpoint = `/api/v1/use/search/similar/${mediaId}${params.toString() ? '?' + params.toString() : ''}`;

    return get<PaginatedResponse<MediaItemResponse>>(endpoint, { requireAuth: true });
  }
}

export const searchService = new SearchService();

import api from '../../../api/api';
import type { UniversalSearchRequest, UniversalSearchResponse } from './types';

export const SearchService = {
  /**
   * Search for people and posts.
   * URI: GET /api/v1/search?q={query}&page={page}&size={size}
   */
  universalSearch: async (params: UniversalSearchRequest): Promise<UniversalSearchResponse> => {
    const query = new URLSearchParams();
    query.append('q', params.q);
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.size !== undefined) query.append('size', params.size.toString());

    const response = await api.get<UniversalSearchResponse>(`search?${query.toString()}`);
    return response.data;
  },
};

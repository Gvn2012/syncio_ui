import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetFeedRequest, 
  GetFeedResponse, 
  CreatePostRequest,
  CreatePostResponse 
} from './types';

export const FeedService = {
  /**
   * Fetch the activity feed.
   * URI: GET http://syncio.site/api/v1/feed
   */
  getFeed: async (params: GetFeedRequest): Promise<APIResource<GetFeedResponse>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const response = await api.get<APIResource<GetFeedResponse>>(`feed?${query.toString()}`);
    return response.data;
  },

  /**
   * Create a new post.
   * URI: POST http://syncio.site/api/v1/feed/posts
   */
  createPost: async (data: CreatePostRequest): Promise<APIResource<CreatePostResponse>> => {
    const response = await api.post<APIResource<CreatePostResponse>>('feed/posts', data);
    return response.data;
  }
};

import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetFeedRequest, 
  GetFeedResponse, 
  CreatePostRequest
} from './types';
import type { Post } from '../types';

export const FeedService = {

  getFeed: async (params: GetFeedRequest): Promise<APIResource<GetFeedResponse>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const response = await api.get<APIResource<GetFeedResponse>>(`feed?${query.toString()}`);
    return response.data;
  },


  createPost: async (data: CreatePostRequest): Promise<APIResource<Post>> => {
    const response = await api.post<APIResource<Post>>('posts', data);
    return response.data;
  },


  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!response.ok) {
      throw new Error(`GCS upload failed: ${response.statusText}`);
    }
  }
};

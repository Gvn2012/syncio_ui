import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { Post } from '../types';


export const fetchFeed = async (cursor?: string, limit: number = 10): Promise<APIResource<Post[]>> => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());
  
  const response = await api.get(`posts/feed?${params.toString()}`);
  return response.data;
};

export const fetchPostById = async (postId: string): Promise<APIResource<Post>> => {
  const response = await api.get(`posts/${postId}`);
  return response.data;
};

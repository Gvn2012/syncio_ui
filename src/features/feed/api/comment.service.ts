import api from "../../../api/api";
import type { APIResource } from "../../../api/types/api-resource";
import type { Comment, CommentPagedResponse } from "../types";

export const CommentService = {
  /**
   * Get root comments for a post.
   */
  getComments: async (postId: string, page: number = 0, size: number = 30): Promise<APIResource<CommentPagedResponse>> => {
    const response = await api.get<APIResource<CommentPagedResponse>>(`posts/${postId}/comments`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Get a single comment by ID.
   */
  getComment: async (postId: string, commentId: string): Promise<APIResource<Comment>> => {
    const response = await api.get<APIResource<Comment>>(`posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  /**
   * Get replies for a specific comment.
   */
  getReplies: async (postId: string, commentId: string, page: number = 0, size: number = 30): Promise<APIResource<CommentPagedResponse>> => {
    const response = await api.get<APIResource<CommentPagedResponse>>(`posts/${postId}/comments/${commentId}/replies`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Add a new comment or reply.
   */
  addComment: async (postId: string, content: string, parentCommentId?: string): Promise<APIResource<Comment>> => {
    const response = await api.post<APIResource<Comment>>(`posts/${postId}/comments`, {
      content,
      parentCommentId
    });
    return response.data;
  },

  /**
   * Update an existing comment.
   */
  updateComment: async (postId: string, commentId: string, content: string): Promise<APIResource<Comment>> => {
    const response = await api.put<APIResource<Comment>>(`posts/${postId}/comments/${commentId}`, {
      content
    });
    return response.data;
  },

  /**
   * Delete a comment (triggers recursive soft-delete).
   */
  deleteComment: async (postId: string, commentId: string): Promise<APIResource<void>> => {
    const response = await api.delete<APIResource<void>>(`posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  /**
   * Pin or unpin a comment.
   */
  togglePin: async (postId: string, commentId: string): Promise<APIResource<void>> => {
    const response = await api.post<APIResource<void>>(`posts/${postId}/comments/${commentId}/pin`);
    return response.data;
  }
};

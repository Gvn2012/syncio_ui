import api from '../../../api/api';
import type { APIResource } from '../../../api/types/api-resource';
import type { 
  GetAnnouncementsRequest, 
  GetAnnouncementsResponse, 
  MarkAsReadRequest,
  MarkAsReadResponse 
} from './types';

export const AnnouncementService = {
  /**
   * Fetch announcements.
   * URI: GET http://syncio.site/api/v1/announcements
   */
  getAnnouncements: async (params: GetAnnouncementsRequest): Promise<APIResource<GetAnnouncementsResponse>> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const response = await api.get<APIResource<GetAnnouncementsResponse>>(`announcements?${query.toString()}`);
    return response.data;
  },

  /**
   * Mark an announcement as read.
   * URI: POST http://syncio.site/api/v1/announcements/read
   */
  markAsRead: async (request: MarkAsReadRequest): Promise<APIResource<MarkAsReadResponse>> => {
    const response = await api.post<APIResource<MarkAsReadResponse>>('announcements/read', request);
    return response.data;
  }
};

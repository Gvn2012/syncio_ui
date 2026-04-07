export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  isRead: boolean;
}

export interface GetAnnouncementsRequest {
  page?: number;
  limit?: number;
}

export interface GetAnnouncementsResponse {
  announcements: Announcement[];
  total: number;
}

export interface MarkAsReadRequest {
  announcementId: string;
}

export interface MarkAsReadResponse {
  success: boolean;
}

import api from "../../../api/api";
import type { APIResource } from "../../../api/types/api-resource";
import type { Pagination } from "../../../api/types/common-types";
import type { NotificationPageResponse } from "./types";

export const NotificationService = {
    getNotifications: async (pagination: Pagination): Promise<APIResource<NotificationPageResponse>> => {
        const response = await api.get<APIResource<NotificationPageResponse>>('notifications', { params: pagination });
        return response.data;
    },

    getUnreadNotifications: async (pagination: Pagination): Promise<APIResource<NotificationPageResponse>> => {
        const response = await api.get<APIResource<NotificationPageResponse>>('notifications/unread', { params: pagination });
        return response.data;
    }
}
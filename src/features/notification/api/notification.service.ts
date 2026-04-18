import api from "../../../api/api";
import type { APIResource } from "../../../api/types/api-resource";
import type { Pagination } from "../../../api/types/common-types";
import type { GetUserNotificationResponse } from "./types";

export const NotificationService = {
    getUserNotification: async(pagination: Pagination): Promise<APIResource<GetUserNotificationResponse[]>> => {
        const response = await api.get<APIResource<GetUserNotificationResponse[]>>('notifications', { params: pagination });
        return response.data;
    }
}
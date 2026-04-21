import type { PageResponse } from "../../../api/types/common-types";

export enum NotificationType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    POST_REACTION = 'POST_REACTION',
    POST_COMMENT = 'POST_COMMENT',
    POST_SHARE = 'POST_SHARE',
    POST_MENTION = 'POST_MENTION',
    FRIEND_REQUEST = 'FRIEND_REQUEST',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    ORG_CREATED = 'ORG_CREATED',
    POST_CREATED = 'POST_CREATED',
    TASK_ASSIGNED = 'TASK_ASSIGNED'
}

export interface GetUserNotificationResponse {
    id: string;
    eventId: string;
    recipientId: string;
    actorId: string;
    targetId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    status: string;
    createdAt: string;
}

export type NotificationPageResponse = PageResponse<GetUserNotificationResponse>;

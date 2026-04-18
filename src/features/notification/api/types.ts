
export enum NotificationType {

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

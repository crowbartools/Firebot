export type NotificationSource = "external" | "internal" | "plugin";

export type NotificationType = "info" | "tip" | "update" | "alert";

export type ExternalNotification = {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
};

export type NotificationBase = {
    title: string;
    message: string;
    type: NotificationType;
    source?: NotificationSource;
    pluginName?: string;
    externalId?: string;
    metadata?: Record<string, unknown>;
};

export type Notification = NotificationBase & {
    id: string;
    timestamp: Date;
    saved: boolean;
    read: boolean;
};

export interface NotificationCache {
    dbVersion?: string;
    notifications: Notification[];
    knownExternalIds: string[];
}
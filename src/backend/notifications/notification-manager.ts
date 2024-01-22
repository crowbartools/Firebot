import { JsonDB } from "node-json-db";
import axios from "axios";
import uuid from "uuid/v4";

import logger from "../logwrapper";
import profileManager from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import utils from "../utility";

export enum NotificationSource {
    EXTERNAL = "external",
    INTERNAL = "internal"
}

export enum NotificationType {
    INFO = "info",
    TIP = "tip",
    UPDATE = "update",
    ALERT = "alert"
}

type ExternalNotification = {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
}

type NotificationBase = {
    title: string;
    message: string;
    type: NotificationType;
    source?: NotificationSource;
    externalId?: string;
}

export type Notification = NotificationBase & {
    id: string;
    timestamp: Date;
    saved: boolean;
    read: boolean;
}

interface NotificationCache {
    dbVersion?: string;
    notifications: Notification[];
    knownExternalIds: string[];
}

const EXTERNAL_NOTIFICATION_SOURCE_URL = "https://raw.githubusercontent.com/crowbartools/Firebot/metadata/notifications/notifications.json";

class NotificationManager {
    private _externalCheckInterval: NodeJS.Timeout;
    private _notificationCache: NotificationCache = {
        dbVersion: "2",
        notifications: [],
        knownExternalIds: []
    };

    constructor() {
        frontendCommunicator.on("get-all-notifications", () => {
            return this.getNotifications();
        });

        frontendCommunicator.on("mark-notification-as-read", (id: string) => {
            this.markNotificationAsRead(id);
        });

        frontendCommunicator.on("delete-notification", (id: string) => {
            this.deleteNotification(id);
        });
    }

    private getNotificationDb(): JsonDB {
        return profileManager.getJsonDbInProfile("notifications");
    }

    private checkNotificationDbVersion(): boolean {
        try {
            return this.getNotificationDb().getData("/dbVersion") === "2";
        } catch (error) {
            logger.debug("No notification dbVersion detected.");
            return false;
        }
    }

    loadNotificationCache(): void {
        this._notificationCache = {
            dbVersion: "2",
            notifications: [],
            knownExternalIds: []
        };

        if (this.checkNotificationDbVersion() !== true) {
            this.getNotificationDb().push("/", this._notificationCache);
        }

        this._notificationCache = this.getNotificationDb().getData("/");
    }

    addNotification(notification: NotificationBase, permenantlySave = false): void {
        const newNotification: Notification = {
            ...notification,
            id: uuid(),
            timestamp: new Date(),
            read: false,
            saved: permenantlySave ?? false,
            source: notification.source ?? NotificationSource.INTERNAL,
            type: notification.type ?? NotificationType.INFO
        };

        this. _notificationCache.notifications.push(newNotification);
        frontendCommunicator.send("new-notification", newNotification);
        this.saveNotifications();
    }

    private saveNotifications(): void {
        this.getNotificationDb().push("/notifications",
            this._notificationCache.notifications.filter(n => n.saved === true));
    }

    getNotifications(): Notification[] {
        return utils.deepClone(this._notificationCache.notifications);
    }

    deleteNotification(id: string): void {
        this._notificationCache.notifications =
            this._notificationCache.notifications.filter(n => n.id !== id);

        this.saveNotifications();

        frontendCommunicator.send("notification-deleted", id);
    }

    markNotificationAsRead(id: string): void {
        const notification = this._notificationCache.notifications.find(n => n.id === id);

        if (notification != null) {
            notification.read = true;
            this.saveNotifications();
        }

        frontendCommunicator.send("notification-marked-as-read", id);
    }

    private getKnownExternalNotifications(): string[] {
        const externalNotificationIds: string[] = this.getNotificationDb().getData("/knownExternalIds");
        return externalNotificationIds ? externalNotificationIds : [];
    }

    private setKnownExternalNotifications(ids: string[]): void {
        this.getNotificationDb().push("/knownExternalIds", ids);
    }

    private async loadExternalNotifications(): Promise<void> {
        try {
            const response = await axios.get<ExternalNotification[]>(EXTERNAL_NOTIFICATION_SOURCE_URL);
            const externalNotifications = response.data;

            const knownExtNotis = this.getKnownExternalNotifications();

            const newKnownExtNotis = [];

            externalNotifications.forEach((n) => {
                newKnownExtNotis.push(n.id);

                if (!knownExtNotis.includes(n.id)) {
                    this.addNotification({
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        source: NotificationSource.EXTERNAL,
                        externalId: n.id
                    }, true);
                }
            });

            this.setKnownExternalNotifications(newKnownExtNotis);

        } catch (error) {
            logger.error("Error loading external notifications", error);
        }
    }

    async loadAllNotifications(): Promise<void> {
        this.loadNotificationCache();
        await this.loadExternalNotifications();
    }

    startExternalNotificationCheck(): void {
        if (this._externalCheckInterval == null) {
            this._externalCheckInterval = setInterval(
                () => this.loadExternalNotifications(), 5 * 60 * 1000);
        }
    }

    stopExternalNotificationCheck(): void {
        if (this._externalCheckInterval != null) {
            clearInterval(this._externalCheckInterval);
            this._externalCheckInterval = null;
        }
    }
}

const notificationManager = new NotificationManager();

export default notificationManager;
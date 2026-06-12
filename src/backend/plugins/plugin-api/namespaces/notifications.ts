import type {
    PluginNotificationsApi
} from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import {
    NotificationManager
} from "../../../notifications/notification-manager";

import {
    type Notification
} from "../../../../types";

export const createNotificationsApi = definePluginApiNamespace<PluginNotificationsApi>((ctx) => {
    const pluginName = ctx.displayName;

    function isOwnedByPlugin(notification: Notification | null): notification is Notification {
        return (
            notification != null
            && notification.source === "plugin"
            && notification.pluginName === pluginName
        );
    }

    return {
        add(notification, permanentlySave = true) {
            const created = NotificationManager.addNotification(
                {
                    ...notification,
                    type: notification.type ?? "info",
                    source: "plugin",
                    pluginName: pluginName
                },
                permanentlySave
            );
            return created;
        },

        get(id) {
            const notification = NotificationManager.getNotification(id);
            return isOwnedByPlugin(notification) ? notification : null;
        },

        getAll() {
            return NotificationManager
                .getNotifications()
                .filter(isOwnedByPlugin);
        },

        delete(id) {
            const notification = NotificationManager.getNotification(id);
            if (isOwnedByPlugin(notification)) {
                NotificationManager.deleteNotification(id);
            }
        },

        clearAll() {
            NotificationManager
                .getNotifications()
                .filter(isOwnedByPlugin)
                .forEach(n => NotificationManager.deleteNotification(n.id));
        }
    };
});

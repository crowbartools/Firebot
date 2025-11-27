import { EventManager } from "../../../events/event-manager";

export function triggerStreamOnline(
    username: string,
    userId: string,
    userDisplayName: string
) {
    void EventManager.triggerEvent("twitch", "stream-online", {
        username,
        userId,
        userDisplayName
    });
}

export function triggerStreamOffline(
    username: string,
    userId: string,
    userDisplayName: string
) {
    void EventManager.triggerEvent("twitch", "stream-offline", {
        username,
        userId,
        userDisplayName
    });
}

export function triggerCategoryChanged(
    category: string,
    categoryId: string
) {
    void EventManager.triggerEvent("twitch", "category-changed", {
        category,
        categoryId
    });
}

export function triggerTitleChanged(
    title: string
) {
    void EventManager.triggerEvent("twitch", "title-changed", {
        title
    });
}
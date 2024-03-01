import eventManager from "../../events/EventManager";

export function triggerStreamOnline(
    username: string,
    userId: string,
    userDisplayName: string
) {
    eventManager.triggerEvent("twitch", "stream-online", {
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
    eventManager.triggerEvent("twitch", "stream-offline", {
        username,
        userId,
        userDisplayName
    });
}

export function triggerCategoryChanged(
    category: string,
    categoryId: string
) {
    eventManager.triggerEvent("twitch", "category-changed", {
        category,
        categoryId
    });
}

export function triggerTitleChanged(
    title: string
) {
    eventManager.triggerEvent("twitch", "title-changed", {
        title
    });
}
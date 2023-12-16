import eventManager from "../../events/EventManager";

export function triggerStreamOnline(
    userId: string,
    userLogin: string,
    userDisplayName: string
) {
    eventManager.triggerEvent("twitch", "stream-online", {
        userId,
        userLogin,
        userDisplayName
    });
};

export function triggerStreamOffline(
    userId: string,
    userLogin: string,
    userDisplayName: string
) {
    eventManager.triggerEvent("twitch", "stream-offline", {
        userId,
        userLogin,
        userDisplayName
    });
};
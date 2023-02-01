import eventManager from "../../events/EventManager";

export function triggerWhisper(
    userDisplayName: string,
    message: string
): void {
    eventManager.triggerEvent("twitch", "whisper", {
        username: userDisplayName,
        message
    });
};
import eventManager from "../../events/EventManager";

export function triggerWhisper(
    username: string,
    userId: string,
    userDisplayName: string,
    message: string,
    sentTo: "streamer" | "bot"
): void {
    eventManager.triggerEvent("twitch", "whisper", {
        username,
        userId,
        userDisplayName,
        message,
        sentTo
    });
}
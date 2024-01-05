import eventManager from "../../events/EventManager";

export function triggerWhisper(
    userDisplayName: string,
    message: string,
    sentTo: "streamer" | "bot"
): void {
    eventManager.triggerEvent("twitch", "whisper", {
        username: userDisplayName,
        message,
        sentTo
    });
}
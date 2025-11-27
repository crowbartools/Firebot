import { EventManager } from "../../../events/event-manager";

export function triggerWhisper(
    username: string,
    userId: string,
    userDisplayName: string,
    message: string,
    sentTo: "streamer" | "bot"
): void {
    void EventManager.triggerEvent("twitch", "whisper", {
        username,
        userId,
        userDisplayName,
        message,
        sentTo
    });
}
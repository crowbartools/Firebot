import eventManager from "../../events/EventManager";

export function triggerIncomingRaid(
    username: string,
    userId: string,
    userDisplayName: string,
    viewerCount = 0
): void {
    eventManager.triggerEvent("twitch", "raid", {
        username,
        userId,
        userDisplayName,
        viewerCount
    });
}
export function triggerRaidSentOff(
    username: string,
    userId: string,
    userDisplayName: string,
    raidTargetUsername: string,
    raidTargetUserId: string,
    raidTargetUserDisplayName: string,
    viewerCount = 0
): void {
    eventManager.triggerEvent("twitch", "raid-sent-off", {
        username,
        userId,
        userDisplayName,
        raidTargetUsername,
        raidTargetUserId,
        raidTargetUserDisplayName,
        viewerCount
    });
}
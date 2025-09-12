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

export function triggerOutgoingRaidStarted(
    username: string,
    userId: string,
    userDisplayName: string,
    raidTargetUsername: string,
    raidTargetUserId: string,
    raidTargetUserDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string,
    viewerCount = 0
) {
    eventManager.triggerEvent("twitch", "outgoing-raid-started", {
        username,
        userId,
        userDisplayName,
        raidTargetUsername,
        raidTargetUserId,
        raidTargetUserDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName,
        viewerCount
    });
}

export function triggerOutgoingRaidCanceled(
    username: string,
    userId: string,
    userDisplayName: string,
    raidTargetUsername: string,
    raidTargetUserId: string,
    raidTargetUserDisplayName: string,
    moderatorUsername: string,
    moderatorId: string,
    moderatorDisplayName: string
) {
    eventManager.triggerEvent("twitch", "outgoing-raid-canceled", {
        username,
        userId,
        userDisplayName,
        raidTargetUsername,
        raidTargetUserId,
        raidTargetUserDisplayName,
        moderatorUsername,
        moderatorId,
        moderatorDisplayName,
        moderator: moderatorDisplayName
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
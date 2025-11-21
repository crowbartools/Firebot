import NodeCache from "node-cache";
import { DateTime } from "luxon";
import { SettingsManager } from "../../../common/settings-manager";
import { EventManager } from "../../../events/event-manager";
import logger from "../../../logwrapper";
import { wait } from "../../../utils";

const communitySubCache = new NodeCache({ stdTTL: 10, checkperiod: 2 });

interface CommunityGiftSubRecipient {
    gifteeUsername: string;
}

interface CommunityGiftSubCache {
    subCount: number;
    giftReceivers: CommunityGiftSubRecipient[];
}

export function triggerCommunitySubGift(
    gifterDisplayName: string,
    communityGiftId: string,
    subCount: number
): void {
    logger.debug(`Received ${subCount} community gift subs from ${gifterDisplayName} (ID: ${communityGiftId}) at ${DateTime.now().toFormat("HH:mm:ss:SSS")}`);
    communitySubCache.set<CommunityGiftSubCache>(communityGiftId, { subCount, giftReceivers: [] });
}

export async function triggerSubGift(
    gifterDisplayName: string,
    gifterUserName: string,
    gifterUserId: string,
    isAnonymous: boolean,
    gifteeDisplayName: string,
    subPlan: string,
    giftDuration: number,
    lifetimeGiftCount: number,
    communityGiftId: string = null
): Promise<void> {
    if (communityGiftId) {
        logger.debug(`Attempting to process community gift sub from ${gifterDisplayName} (ID: ${communityGiftId}) at ${DateTime.now().toFormat("HH:mm:ss:SSS")}`);

        let cache = communitySubCache.get<CommunityGiftSubCache>(communityGiftId);

        // There's a race condition where the individual gift sub may come in before the community one.
        // Let's just wait here until the community one shows up, then process the individual one.
        if (cache == null) {
            logger.debug(`Community gift cache doesn't contain an entry for ${communityGiftId} yet. Waiting...`);

            while (cache == null) {
                await wait(250);
                cache = communitySubCache.get<CommunityGiftSubCache>(communityGiftId);
            }
        }

        let communityCount = cache.subCount;
        const giftReceivers = cache.giftReceivers;

        if (communityCount > 0) {
            giftReceivers.push({ gifteeUsername: gifteeDisplayName });

            if (--communityCount > 0) {
                communitySubCache.set<CommunityGiftSubCache>(communityGiftId, { subCount: communityCount, giftReceivers: giftReceivers });
            } else {
                void EventManager.triggerEvent("twitch", "community-subs-gifted", {
                    username: gifterUserName,
                    userId: gifterUserId,
                    userDisplayName: gifterDisplayName,
                    subCount: giftReceivers.length,
                    subPlan,
                    isAnonymous,
                    gifterUsername: gifterDisplayName,
                    giftReceivers: giftReceivers,
                    lifetimeGiftCount
                });

                logger.debug(`Community gift sub event triggered for ID ${communityGiftId}, deleting cache`);
                communitySubCache.del(communityGiftId);
            }
        }
    }

    if (communityGiftId == null || SettingsManager.getSetting("IgnoreSubsequentSubEventsAfterCommunitySub") !== true) {
        void EventManager.triggerEvent("twitch", "subs-gifted", {
            username: gifterUserName,
            userId: gifterUserId,
            userDisplayName: gifterDisplayName,
            gifteeUsername: gifteeDisplayName,
            gifterUsername: gifterDisplayName,
            subPlan,
            isAnonymous,
            giftDuration,
            lifetimeGiftCount
        });
        logger.debug(`Gift Sub event triggered`);
    }
}

export function triggerSubGiftUpgrade(
    gifteeUsername: string,
    gifteeUserId: string,
    gifteeDisplayName: string,
    gifterDisplayName: string,
    subPlan: string
): void {
    void EventManager.triggerEvent("twitch", "gift-sub-upgraded", {
        username: gifteeUsername,
        userId: gifteeUserId,
        userDisplayName: gifteeDisplayName,
        gifterUsername: gifterDisplayName,
        gifteeUsername: gifteeDisplayName,
        subPlan
    });
}
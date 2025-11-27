import type {
    EventSubChannelRewardEvent,
    EventSubChannelSharedChatSessionParticipant
} from "@twurple/eventsub-base";
import type { SharedChatParticipant } from "../../../../../types";
import type { CustomReward } from "../resource/channel-rewards";

export function mapEventSubRewardToTwitchData(event: EventSubChannelRewardEvent): CustomReward {
    const image = {
        url1x: event.getImageUrl(1),
        url2x: event.getImageUrl(2),
        url4x: event.getImageUrl(4)
    };

    const customReward: CustomReward = {
        broadcasterId: event.broadcasterId,
        broadcasterLogin: event.broadcasterName,
        broadcasterName: event.broadcasterDisplayName,
        id: event.id,
        title: event.title,
        prompt: event.prompt,
        cost: event.cost,
        image: image,
        defaultImage: image,
        backgroundColor: event.backgroundColor,
        isEnabled: event.isEnabled,
        isUserInputRequired: event.userInputRequired,
        maxPerStreamSetting: {
            isEnabled: event.maxRedemptionsPerStream !== null,
            maxPerStream: event.maxRedemptionsPerStream
        },
        maxPerUserPerStreamSetting: {
            isEnabled: event.maxRedemptionsPerUserPerStream !== null,
            maxPerUserPerStream: event.maxRedemptionsPerUserPerStream
        },
        globalCooldownSetting: {
            isEnabled: event.globalCooldown !== null,
            globalCooldownSeconds: event.globalCooldown
        },
        isPaused: event.isPaused,
        isInStock: event.isInStock,
        shouldRedemptionsSkipRequestQueue: event.autoApproved,
        cooldownExpiresAt: event.cooldownExpiryDate
    };

    return customReward;
}

export function getChannelRewardImageUrl(reward: CustomReward): string {
    return reward.image?.url4x || reward.image?.url2x || reward.image?.url1x || "";
}

export async function mapSharedChatParticipants(
    participants: EventSubChannelSharedChatSessionParticipant[]
): Promise<SharedChatParticipant[]> {
    return await Promise.all(participants.map(
        async (p): Promise<SharedChatParticipant> => {
            const user = await p.getBroadcaster();

            return {
                broadcasterId: user.id,
                broadcasterName: user.name,
                broadcasterDisplayName: user.displayName,
                profilePictureUrl: user.profilePictureUrl
            };
        }
    ));
}
import { EventSubSubscription } from "@twurple/eventsub-base";
import { EventSubWsListener } from "@twurple/eventsub-ws";

import type { SavedChannelReward } from "../../../../../types";

import { AccountAccess } from "../../../../common/account-access";
import { SharedChatCache } from "../../chat/shared-chat-cache";
import { TwitchEventHandlers } from "../../events";
import { TwitchApi } from "..";
import channelRewardManager from "../../../../channel-rewards/channel-reward-manager";
import twitchRolesManager from "../../../../roles/twitch-roles-manager";
import chatHelpers from "../../../../chat/chat-helpers";
import rewardManager from "../../../../channel-rewards/channel-reward-manager";
import twitchStreamInfoPoll from "../../stream-info-manager";
import viewerDatabase from "../../../../viewers/viewer-database";
import frontendCommunicator from "../../../../common/frontend-communicator";
import logger from "../../../../logwrapper";
import {
    getChannelRewardImageUrl,
    mapEventSubRewardToTwitchData,
    mapSharedChatParticipants
} from "./eventsub-helpers";

class TwitchEventSubClient {
    private _eventSubListener: EventSubWsListener;
    private _subscriptions: Array<EventSubSubscription> = [];

    private createSubscriptions(): void {
        const streamer = AccountAccess.getAccounts().streamer;

        // Stream online
        const onlineSubscription = this._eventSubListener.onStreamOnline(streamer.userId, (event) => {
            TwitchEventHandlers.stream.triggerStreamOnline(
                event.broadcasterName,
                event.broadcasterId,
                event.broadcasterDisplayName
            );
        });
        this._subscriptions.push(onlineSubscription);

        // Stream offline
        const offlineSubscription = this._eventSubListener.onStreamOffline(streamer.userId, (event) => {
            TwitchEventHandlers.stream.triggerStreamOffline(
                event.broadcasterName,
                event.broadcasterId,
                event.broadcasterDisplayName
            );
        });
        this._subscriptions.push(offlineSubscription);

        // Follows
        const followSubscription = this._eventSubListener.onChannelFollow(streamer.userId, streamer.userId, (event) => {
            TwitchEventHandlers.follow.triggerFollow(
                event.userName,
                event.userId,
                event.userDisplayName
            );
        });
        this._subscriptions.push(followSubscription);

        // Bits Used
        const bitsSubscription = this._eventSubListener.onChannelBitsUse(streamer.userId, async (event) => {
            switch (event.type) {
                case "cheer": {
                    const totalBits = (await TwitchApi.bits.getChannelBitsLeaderboard(1, "all", new Date(), event.userId))[0]?.amount ?? 0;
                    // Future: We could parse event.messageParts into a FirebotChatMessage
                    // This would allow us to expose cheermotes to the cheer event,
                    // rather than just chat messages which happen to be cheers.
                    TwitchEventHandlers.bits.triggerCheer(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.bits,
                        totalBits,
                        event.messageText ?? ""
                    );
                    break;
                }
                case "combo":
                    break;
                case "power_up": {
                    const totalBits = (await TwitchApi.bits.getChannelBitsLeaderboard(1, "all", new Date(), event.userId))[0]?.amount ?? 0;
                    switch (event.powerUp.type) {
                        case "celebration":
                            TwitchEventHandlers.bits.triggerPowerupCelebration(
                                event.userName,
                                event.userId,
                                event.userDisplayName,
                                event.bits,
                                totalBits
                            );
                            break;
                        case "gigantify_an_emote": {
                            TwitchEventHandlers.bits.triggerPowerupGigantifyEmote(
                                event.userName,
                                event.userId,
                                event.userDisplayName,
                                event.bits,
                                totalBits,
                                event.messageText ?? "",
                                event.powerUp.emote.name,
                                `https://static-cdn.jtvnw.net/emoticons/v2/${event.powerUp.emote.id}/default/dark/3.0`
                            );
                            break;
                        }
                        case "message_effect": {
                            TwitchEventHandlers.bits.triggerPowerupMessageEffect(
                                event.userName,
                                event.userId,
                                event.userDisplayName,
                                event.bits,
                                totalBits,
                                event.messageText ?? ""
                            );
                            break;
                        }
                    }
                    break;
                }
            }
        });
        this._subscriptions.push(bitsSubscription);

        // AutoMod message hold v2
        const autoModMessageHoldSub = this._eventSubListener.onAutoModMessageHoldV2(streamer.userId, streamer.userId, async (event) => {
            const firebotChatMessage = await chatHelpers.buildViewerFirebotChatMessageFromAutoModMessage(event);
            frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
        });
        this._subscriptions.push(autoModMessageHoldSub);

        // AutoMod message update v2
        const autoModMessageUpdateSub = this._eventSubListener.onAutoModMessageUpdateV2(streamer.userId, streamer.userId, (event) => {
            frontendCommunicator.send("twitch:chat:automod-update", {
                messageId: event.messageId,
                newStatus: event.status,
                resolverName: event.moderatorName,
                resolverId: event.moderatorId,
                flaggedPhrases: event.reason === "automod"
                    ? event.autoMod?.boundaries?.map(b => b.text) ?? []
                    : event.blockedTerms?.map(b => b.text) ?? []
            });
        });
        this._subscriptions.push(autoModMessageUpdateSub);

        // Channel automatic reward
        const channelAutomaticRewardSubscription = this._eventSubListener.onChannelAutomaticRewardRedemptionAddV2(streamer.userId, (event) => {
            switch (event.reward.type) {
                case "single_message_bypass_sub_mode":
                    TwitchEventHandlers.rewardRedemption.triggerRedemptionSingleMessageBypassSubMode(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.reward.channelPoints
                    );
                    break;
                case "send_highlighted_message":
                    TwitchEventHandlers.rewardRedemption.triggerRedemptionSendHighlightedMessage(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.reward.channelPoints,
                        event.messageText
                    );
                    break;
                case "random_sub_emote_unlock":
                    TwitchEventHandlers.rewardRedemption.triggerRedemptionRandomSubEmoteUnlock(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.reward.channelPoints,
                        event.reward.emote.name,
                        `https://static-cdn.jtvnw.net/emoticons/v2/${event.reward.emote.id}/default/dark/3.0`
                    );
                    break;
                case "chosen_sub_emote_unlock":
                    TwitchEventHandlers.rewardRedemption.triggerRedemptionChosenSubEmoteUnlock(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.reward.channelPoints,
                        event.reward.emote.name,
                        `https://static-cdn.jtvnw.net/emoticons/v2/${event.reward.emote.id}/default/dark/3.0`
                    );
                    break;
                case "chosen_modified_sub_emote_unlock":
                    TwitchEventHandlers.rewardRedemption.triggerRedemptionChosenModifiedSubEmoteUnlock(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.reward.channelPoints,
                        event.reward.emote.name,
                        `https://static-cdn.jtvnw.net/emoticons/v2/${event.reward.emote.id}/default/dark/3.0`
                    );
                    break;

            }
        });
        this._subscriptions.push(channelAutomaticRewardSubscription);

        // Channel custom reward add
        const customRewardAddSubscription = this._eventSubListener.onChannelRewardAdd(streamer.userId, (event) => {
            channelRewardManager.saveTwitchDataForChannelReward(mapEventSubRewardToTwitchData(event));
        });
        this._subscriptions.push(customRewardAddSubscription);

        // Channel custom reward update
        const customRewardUpdateSubscription = this._eventSubListener.onChannelRewardUpdate(streamer.userId, (event) => {
            channelRewardManager.saveTwitchDataForChannelReward(mapEventSubRewardToTwitchData(event));
        });
        this._subscriptions.push(customRewardUpdateSubscription);

        // Channel custom reward remove
        const customRewardRemoveSubscription = this._eventSubListener.onChannelRewardRemove(streamer.userId, async (event) => {
            const firebotReward: SavedChannelReward | null = channelRewardManager.getChannelReward(event.id);

            if (!firebotReward) {
                return;
            }

            await channelRewardManager.deleteChannelReward(event.id, false, true);
        });
        this._subscriptions.push(customRewardRemoveSubscription);

        // Channel custom reward
        const customRewardRedemptionSubscription = this._eventSubListener.onChannelRedemptionAdd(streamer.userId, (event) => {
            const reward = channelRewardManager.getChannelReward(event.rewardId);
            if (!reward) {
                logger.debug(`Received a reward redemption for a reward that does not exist locally. Reward: ${event.rewardTitle}`, event);
                return;
            }

            const imageUrl = getChannelRewardImageUrl(reward.twitchData);

            TwitchEventHandlers.rewardRedemption.handleRewardRedemption(
                event.id,
                event.status,
                event.input,
                event.userId,
                event.userName,
                event.userDisplayName,
                event.rewardId,
                event.rewardTitle,
                event.rewardPrompt,
                event.rewardCost,
                imageUrl
            );

            if (!reward.twitchData.shouldRedemptionsSkipRequestQueue && reward.manageable) {
                rewardManager.addRewardRedemption(event.rewardId, {
                    id: event.id,
                    rewardId: event.rewardId,
                    redemptionDate: event.redemptionDate,
                    userId: event.userId,
                    userName: event.userName,
                    userDisplayName: event.userDisplayName,
                    rewardMessage: event.input
                });
            }
        });
        this._subscriptions.push(customRewardRedemptionSubscription);

        const customRewardRedemptionUpdateSubscription = this._eventSubListener.onChannelRedemptionUpdate(streamer.userId, (event) => {
            const reward = channelRewardManager.getChannelReward(event.rewardId);
            if (!reward) {
                logger.debug(`Received a reward redemption update for a reward that does not exist locally. Reward: ${event.rewardTitle}`, event);
                return;
            }

            if (reward.twitchData.shouldRedemptionsSkipRequestQueue) {
                logger.debug(`Received a reward redemption update for a reward that should skip the request queue. Reward: ${event.rewardTitle}`, event);
                return;
            }

            const imageUrl = getChannelRewardImageUrl(reward.twitchData);

            TwitchEventHandlers.rewardRedemption.handleRewardUpdated(
                event.id,
                event.status,
                event.input,
                event.userId,
                event.userName,
                event.userDisplayName,
                event.rewardId,
                event.rewardTitle,
                event.rewardPrompt,
                event.rewardCost,
                imageUrl
            );

            if (reward.manageable) {
                rewardManager.removeRewardRedemption(event.rewardId, event.id);
            }
        });
        this._subscriptions.push(customRewardRedemptionUpdateSubscription);

        // Incoming Raid
        const incomingRaidSubscription = this._eventSubListener.onChannelRaidTo(streamer.userId, (event) => {
            TwitchEventHandlers.raid.triggerIncomingRaid(
                event.raidingBroadcasterName,
                event.raidingBroadcasterId,
                event.raidingBroadcasterDisplayName,
                event.viewers
            );
        });
        this._subscriptions.push(incomingRaidSubscription);

        // Outbound Raid Sent Off
        const outboundRaidSubscription = this._eventSubListener.onChannelRaidFrom(streamer.userId, (event) => {
            // sent off
            if (event.raidingBroadcasterId === streamer.userId && event.raidedBroadcasterId !== streamer.userId) {
                TwitchEventHandlers.raid.triggerRaidSentOff(
                    event.raidingBroadcasterName,
                    event.raidingBroadcasterId,
                    event.raidingBroadcasterDisplayName,
                    event.raidedBroadcasterName,
                    event.raidedBroadcasterId,
                    event.raidedBroadcasterDisplayName,
                    event.viewers
                );
            }
        });
        this._subscriptions.push(outboundRaidSubscription);

        // Shared Chat Started
        const sharedChatStartedSubscription = this._eventSubListener.onChannelSharedChatSessionBegin(streamer.userId, async (event) => {
            SharedChatCache.enableSharedChat();
            SharedChatCache.participants = await mapSharedChatParticipants(event.participants);
            TwitchEventHandlers.chat.triggerSharedChatEnabled();
        });
        this._subscriptions.push(sharedChatStartedSubscription);

        // Shared Chat Updated
        const sharedChatUpdatedSubscription = this._eventSubListener.onChannelSharedChatSessionUpdate(streamer.userId, async (event) => {
            SharedChatCache.participants = await mapSharedChatParticipants(event.participants);
            TwitchEventHandlers.chat.triggerSharedChatUpdated();
        });
        this._subscriptions.push(sharedChatUpdatedSubscription);

        // Shared Chat Ended
        const sharedChatEndedSubscription = this._eventSubListener.onChannelSharedChatSessionEnd(streamer.userId, () => {
            SharedChatCache.disableSharedChat();
            TwitchEventHandlers.chat.triggerSharedChatEnded();
        });
        this._subscriptions.push(sharedChatEndedSubscription);

        // Shoutout sent to another channel
        const shoutoutSentSubscription = this._eventSubListener.onChannelShoutoutCreate(streamer.userId, streamer.userId, (event) => {
            TwitchEventHandlers.shoutout.triggerShoutoutSent(
                event.shoutedOutBroadcasterName,
                event.shoutedOutBroadcasterId,
                event.shoutedOutBroadcasterDisplayName,
                event.moderatorName,
                event.moderatorId,
                event.moderatorDisplayName,
                event.viewerCount
            );
        });
        this._subscriptions.push(shoutoutSentSubscription);

        // Shoutout received from another channel
        const shoutoutReceivedSubscription = this._eventSubListener.onChannelShoutoutReceive(streamer.userId, streamer.userId, (event) => {
            TwitchEventHandlers.shoutout.triggerShoutoutReceived(
                event.shoutingOutBroadcasterName,
                event.shoutingOutBroadcasterId,
                event.shoutingOutBroadcasterDisplayName,
                event.viewerCount
            );
        });
        this._subscriptions.push(shoutoutReceivedSubscription);

        // Hype Train start
        const hypeTrainBeginSubscription = this._eventSubListener.onChannelHypeTrainBeginV2(streamer.userId, (event) => {
            TwitchEventHandlers.hypeTrain.triggerHypeTrainStart(
                event.total,
                event.progress,
                event.goal,
                event.level,
                event.startDate,
                event.expiryDate,
                event.topContributors,
                event.type,
                event.isSharedTrain
            );
        });
        this._subscriptions.push(hypeTrainBeginSubscription);

        // Hype Train progress
        const hypeTrainProgressSubscription = this._eventSubListener.onChannelHypeTrainProgressV2(streamer.userId, (event) => {
            TwitchEventHandlers.hypeTrain.triggerHypeTrainProgress(
                event.total,
                event.progress,
                event.goal,
                event.level,
                event.startDate,
                event.expiryDate,
                event.topContributors,
                event.type,
                event.isSharedTrain
            );
        });
        this._subscriptions.push(hypeTrainProgressSubscription);

        // Hype Train end
        const hypeTrainEndSubscription = this._eventSubListener.onChannelHypeTrainEndV2(streamer.userId, (event) => {
            TwitchEventHandlers.hypeTrain.triggerHypeTrainEnd(
                event.total,
                event.level,
                event.startDate,
                event.endDate,
                event.cooldownEndDate,
                event.topContributors,
                event.type,
                event.isSharedTrain
            );
        });
        this._subscriptions.push(hypeTrainEndSubscription);

        // Channel goal begin
        const channelGoalBeginSubscription = this._eventSubListener.onChannelGoalBegin(streamer.userId, (event) => {
            TwitchEventHandlers.goal.triggerChannelGoalBegin(
                event.description,
                event.type,
                event.startDate,
                event.currentAmount,
                event.targetAmount
            );
        });
        this._subscriptions.push(channelGoalBeginSubscription);

        // Channel goal progress
        const channelGoalProgressSubscription = this._eventSubListener.onChannelGoalProgress(streamer.userId, (event) => {
            TwitchEventHandlers.goal.triggerChannelGoalProgress(
                event.description,
                event.type,
                event.startDate,
                event.currentAmount,
                event.targetAmount
            );
        });
        this._subscriptions.push(channelGoalProgressSubscription);

        // Channel goal end
        const channelGoalEndSubscription = this._eventSubListener.onChannelGoalEnd(streamer.userId, (event) => {
            TwitchEventHandlers.goal.triggerChannelGoalEnd(
                event.description,
                event.type,
                event.startDate,
                event.endDate,
                event.currentAmount,
                event.targetAmount,
                event.isAchieved
            );
        });
        this._subscriptions.push(channelGoalEndSubscription);

        // Channel poll begin
        const pollBeginSubscription = this._eventSubListener.onChannelPollBegin(streamer.userId, (event) => {
            TwitchEventHandlers.poll.triggerChannelPollBegin(
                event.title,
                event.choices,
                event.startDate,
                event.endDate,
                event.isChannelPointsVotingEnabled,
                event.channelPointsPerVote
            );
        });
        this._subscriptions.push(pollBeginSubscription);

        // Channel poll progress
        const pollProgressSubscription = this._eventSubListener.onChannelPollProgress(streamer.userId, (event) => {
            TwitchEventHandlers.poll.triggerChannelPollProgress(
                event.title,
                event.choices,
                event.startDate,
                event.endDate,
                event.isChannelPointsVotingEnabled,
                event.channelPointsPerVote
            );
        });
        this._subscriptions.push(pollProgressSubscription);

        // Channel poll end
        const pollEndSubscription = this._eventSubListener.onChannelPollEnd(streamer.userId, (event) => {
            if (event.status !== "archived") {
                TwitchEventHandlers.poll.triggerChannelPollEnd(
                    event.title,
                    event.choices,
                    event.startDate,
                    event.endDate,
                    event.isChannelPointsVotingEnabled,
                    event.channelPointsPerVote,
                    event.status
                );
            }
        });
        this._subscriptions.push(pollEndSubscription);

        // Channel prediction begin
        const predictionBeginSubscription = this._eventSubListener.onChannelPredictionBegin(streamer.userId, (event) => {
            TwitchEventHandlers.prediction.triggerChannelPredictionBegin(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionBeginSubscription);

        // Channel prediction progress
        const predictionProgressSubscription = this._eventSubListener.onChannelPredictionProgress(streamer.userId, (event) => {
            TwitchEventHandlers.prediction.triggerChannelPredictionProgress(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionProgressSubscription);

        // Channel prediction lock
        const predictionLockSubscription = this._eventSubListener.onChannelPredictionLock(streamer.userId, (event) => {
            TwitchEventHandlers.prediction.triggerChannelPredictionLock(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionLockSubscription);

        // Channel prediction end
        const predictionEndSubscription = this._eventSubListener.onChannelPredictionEnd(streamer.userId, (event) => {
            TwitchEventHandlers.prediction.triggerChannelPredictionEnd(
                event.title,
                event.outcomes,
                event.winningOutcome,
                event.startDate,
                event.endDate,
                event.status
            );
        });
        this._subscriptions.push(predictionEndSubscription);

        // Ban
        const banSubscription = this._eventSubListener.onChannelBan(streamer.userId, (event) => {
            if (event.endDate) {
                const timeoutDuration = (event.endDate.getTime() - event.startDate.getTime()) / 1000;
                TwitchEventHandlers.viewerTimeout.triggerTimeout(
                    event.userName,
                    event.userId,
                    event.userDisplayName,
                    event.moderatorName,
                    event.moderatorId,
                    event.moderatorDisplayName,
                    timeoutDuration,
                    event.reason
                );
            } else {
                TwitchEventHandlers.viewerBanned.triggerBanned(
                    event.userName,
                    event.userId,
                    event.userDisplayName,
                    event.moderatorName,
                    event.moderatorId,
                    event.moderatorDisplayName,
                    event.reason
                );
            }

            frontendCommunicator.send("twitch:chat:user:delete-messages", event.userName);
        });
        this._subscriptions.push(banSubscription);

        // Charity Campaign Start
        const charityCampaignStartSubscription = this._eventSubListener.onChannelCharityCampaignStart(streamer.userId, (event) => {
            TwitchEventHandlers.charity.triggerCharityCampaignStart(
                event.charityName,
                event.charityDescription,
                event.charityLogo,
                event.charityWebsite,
                event.currentAmount.localizedValue,
                event.currentAmount.currency,
                event.targetAmount.localizedValue,
                event.targetAmount.currency
            );
        });
        this._subscriptions.push(charityCampaignStartSubscription);

        // Charity Donation
        const charityDonationSubscription = this._eventSubListener.onChannelCharityDonation(streamer.userId, (event) => {
            TwitchEventHandlers.charity.triggerCharityDonation(
                event.donorName,
                event.donorId,
                event.donorDisplayName,
                event.charityName,
                event.charityDescription,
                event.charityLogo,
                event.charityWebsite,
                event.amount.localizedValue,
                event.amount.currency
            );
        });
        this._subscriptions.push(charityDonationSubscription);

        // Charity Campaign Progress
        const charityCampaignProgressSubscription = this._eventSubListener.onChannelCharityCampaignProgress(streamer.userId, (event) => {
            TwitchEventHandlers.charity.triggerCharityCampaignProgress(
                event.charityName,
                event.charityDescription,
                event.charityLogo,
                event.charityWebsite,
                event.currentAmount.localizedValue,
                event.currentAmount.currency,
                event.targetAmount.localizedValue,
                event.targetAmount.currency
            );
        });
        this._subscriptions.push(charityCampaignProgressSubscription);

        // Charity Campaign End
        const charityCampaignEndSubscription = this._eventSubListener.onChannelCharityCampaignStop(streamer.userId, (event) => {
            TwitchEventHandlers.charity.triggerCharityCampaignEnd(
                event.charityName,
                event.charityDescription,
                event.charityLogo,
                event.charityWebsite,
                event.currentAmount.localizedValue,
                event.currentAmount.currency,
                event.targetAmount.localizedValue,
                event.targetAmount.currency
            );
        });
        this._subscriptions.push(charityCampaignEndSubscription);

        const channelUpdateSubscription = this._eventSubListener.onChannelUpdate(streamer.userId, (event) => {
            twitchStreamInfoPoll.updateStreamInfo({
                categoryId: event.categoryId,
                categoryName: event.categoryName,
                title: event.streamTitle,
                language: event.streamLanguage
            });
        });
        this._subscriptions.push(channelUpdateSubscription);

        // Ad break start/end
        const channelAdBreakBeginSubscription = this._eventSubListener.onChannelAdBreakBegin(streamer.userId, (event) => {
            TwitchEventHandlers.ad.triggerAdBreakStart(
                event.requesterName,
                event.requesterId,
                event.requesterDisplayName,
                event.startDate,
                event.durationSeconds,
                event.isAutomatic
            );

            const adBreakEndTime = new Date(event.startDate.getTime());
            adBreakEndTime.setSeconds(event.startDate.getSeconds() + event.durationSeconds);

            setTimeout(() => {
                TwitchEventHandlers.ad.triggerAdBreakEnd(
                    event.requesterName,
                    event.requesterId,
                    event.requesterDisplayName,
                    event.durationSeconds,
                    event.isAutomatic
                );
            }, adBreakEndTime.getTime() - (new Date()).getTime());
        });
        this._subscriptions.push(channelAdBreakBeginSubscription);

        // Channel Moderate
        const channelModerateSubscription = this._eventSubListener.onChannelModerate(streamer.userId, streamer.userId, (event) => {
            switch (event.moderationAction) {
                case "clear":
                    frontendCommunicator.send("twitch:chat:clear-feed", event.moderatorName);
                    TwitchEventHandlers.chat.triggerChatCleared(event.moderatorName, event.moderatorId);
                    break;
                case "mod":
                    twitchRolesManager.addModeratorToModeratorsList({
                        id: event.userId,
                        username: event.userName,
                        displayName: event.userDisplayName
                    });
                    break;
                case "unmod":
                    twitchRolesManager.removeModeratorFromModeratorsList(event.userId);
                    break;
                case "vip":
                    twitchRolesManager.addVipToVipList({
                        id: event.userId,
                        username: event.userName,
                        displayName: event.userDisplayName
                    });
                    break;
                case "unvip":
                    twitchRolesManager.removeVipFromVipList(event.userId);
                    break;

                // chat modes
                case "emoteonly":
                case "emoteonlyoff":
                case "subscribers":
                case "subscribersoff":
                case "followers":
                case "followersoff":
                case "slow":
                case "slowoff":
                case "uniquechat":
                case "uniquechatoff":
                    TwitchEventHandlers.chatModeChanged.triggerChatModeChanged(
                        event.moderationAction,
                        event.moderationAction.includes("off") ? "disabled" : "enabled",
                        event.moderatorName,
                        event.moderationAction === "slow" ? event.waitTimeSeconds : null
                    );
                    break;

                // Chat Message Deleted
                case "delete":
                    TwitchEventHandlers.chatMessage.triggerChatMessageDeleted(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.messageText,
                        event.messageId
                    );
                    frontendCommunicator.send("twitch:chat:message:deleted", event.messageId);
                    break;

                // Outbound Raid Starting
                case "raid":
                    TwitchEventHandlers.raid.triggerOutgoingRaidStarted(
                        event.broadcasterName,
                        event.broadcasterId,
                        event.broadcasterDisplayName,
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.moderatorName,
                        event.moderatorId,
                        event.moderatorDisplayName,
                        event.viewerCount
                    );
                    break;

                // Outbound Raid Canceled
                case "unraid":
                    TwitchEventHandlers.raid.triggerOutgoingRaidCanceled(
                        event.broadcasterName,
                        event.broadcasterId,
                        event.broadcasterDisplayName,
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.moderatorName,
                        event.moderatorId,
                        event.moderatorDisplayName
                    );
                    break;

                case "unban":
                case "untimeout":
                    TwitchEventHandlers.viewerBanned.triggerUnbanned(
                        event.userName,
                        event.userId,
                        event.userDisplayName,
                        event.moderatorName,
                        event.moderatorId,
                        event.moderatorDisplayName
                    );
                    break;

                // Reserving; already handled in bespoke events; less expensive to move those here.
                case "ban":
                case "timeout":
                    break;

                // Available for future use:
                case "add_blocked_term":
                case "add_permitted_term":
                case "approve_unban_request":
                case "deny_unban_request":
                case "remove_blocked_term":
                case "remove_permitted_term":
                case "warn":
                default:
                    break;
            }
        });
        this._subscriptions.push(channelModerateSubscription);

        // Chat notification
        const chatNotificationSubscription = this._eventSubListener.onChannelChatNotification(streamer.userId, streamer.userId, async (event) => {
            switch (event.type) {
                case "bits_badge_tier":
                    TwitchEventHandlers.bits.triggerBitsBadgeUnlock(
                        event.chatterName ?? "ananonymouscheerer",
                        event.chatterId,
                        event.chatterDisplayName ?? "An Anonymous Cheerer",
                        event.messageText ?? "",
                        event.newTier
                    );
                    break;

                case "resub":
                case "sub":
                    TwitchEventHandlers.sub.triggerSub(
                        event.chatterName,
                        event.chatterId,
                        event.chatterDisplayName,
                        event.isPrime ? "Prime" : event.tier,
                        event.type === "resub" ? event.cumulativeMonths : 1,
                        event.messageText ?? "",
                        event.type === "resub" ? event.streakMonths : 1,
                        event.isPrime,
                        event.type === "resub"
                    );
                    break;

                case "community_sub_gift":
                    TwitchEventHandlers.giftSub.triggerCommunitySubGift(
                        event.chatterDisplayName ?? "An Anonymous Gifter",
                        event.id,
                        event.amount
                    );
                    break;

                case "sub_gift":
                    await TwitchEventHandlers.giftSub.triggerSubGift(
                        event.chatterDisplayName ?? "An Anonymous Gifter",
                        event.chatterName,
                        event.chatterId,
                        event.chatterIsAnonymous,
                        event.recipientDisplayName,
                        event.tier,
                        event.durationMonths,
                        event.cumulativeAmount,
                        event.communityGiftId
                    );
                    await viewerDatabase.calculateAutoRanks(event.recipientId);
                    break;

                case "gift_paid_upgrade":
                    {
                        // IRC chat included this in the event payload. EventSub does not.
                        const upgradeTier = (await (await event.getBroadcaster()).getSubscriber(event.chatterId)).tier;

                        TwitchEventHandlers.giftSub.triggerSubGiftUpgrade(
                            event.chatterName,
                            event.chatterId,
                            event.chatterDisplayName,
                            event.gifterDisplayName,
                            upgradeTier
                        );
                    }
                    await viewerDatabase.calculateAutoRanks(event.chatterId);
                    break;

                case "prime_paid_upgrade":
                    TwitchEventHandlers.sub.triggerPrimeUpgrade(
                        event.chatterName,
                        event.chatterId,
                        event.chatterDisplayName,
                        event.tier
                    );
                    await viewerDatabase.calculateAutoRanks(event.chatterId);
                    break;

                default:
                    logger.debug(`Unknown EventSub chat notification type: ${event.type}. Metadata:`, event);
                    break;
            }
        });
        this._subscriptions.push(chatNotificationSubscription);
    }

    createClient(): void {
        this.disconnectEventSub();

        logger.info("Connecting to Twitch EventSub...");

        try {
            this._eventSubListener = new EventSubWsListener({
                apiClient: TwitchApi.streamerClient
            });

            this._eventSubListener.start();

            this.createSubscriptions();

            logger.info("Connected to the Twitch EventSub!");
        } catch (error) {
            logger.error("Failed to connect to Twitch EventSub", error);
            return;
        }
    }

    removeSubscriptions(): void {
        for (const sub of this._subscriptions) {
            try {
                sub.stop();
            } catch {
                // Silently fail, because we don't care
            }
        }
        this._subscriptions = [];
    }

    disconnectEventSub(): void {
        this.removeSubscriptions();
        try {
            if (this._eventSubListener) {
                this._eventSubListener.stop();
                logger.info("Disconnected from EventSub.");
            }
        } catch (error) {
            logger.debug("Error disconnecting EventSub", error);
        }
    }
}

const client = new TwitchEventSubClient();

export { client as TwitchEventSubClient };
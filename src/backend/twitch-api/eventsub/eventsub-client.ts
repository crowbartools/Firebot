import { EventSubSubscription } from "@twurple/eventsub-base";
import { EventSubWsListener } from "@twurple/eventsub-ws";

import logger from "../../logwrapper";
import accountAccess from "../../common/account-access";
import frontendCommunicator from "../../common/frontend-communicator";
import twitchEventsHandler from '../../events/twitch-events';
import twitchApi from "../api";
import twitchStreamInfoPoll from "../stream-info-manager";
import rewardManager from "../../channel-rewards/channel-reward-manager";
import chatRolesManager from "../../roles/chat-roles-manager";

class TwitchEventSubClient {
    private _eventSubListener: EventSubWsListener;
    private _subscriptions: Array<EventSubSubscription> = [];

    private createSubscriptions(): void {
        const streamer = accountAccess.getAccounts().streamer;

        // Stream online
        const onlineSubscription = this._eventSubListener.onStreamOnline(streamer.userId, (event) => {
            twitchEventsHandler.stream.triggerStreamOnline(
                event.broadcasterName,
                event.broadcasterId,
                event.broadcasterDisplayName
            );
        });
        this._subscriptions.push(onlineSubscription);

        // Stream offline
        const offlineSubscription = this._eventSubListener.onStreamOffline(streamer.userId, (event) => {
            twitchEventsHandler.stream.triggerStreamOffline(
                event.broadcasterName,
                event.broadcasterId,
                event.broadcasterDisplayName
            );
        });
        this._subscriptions.push(offlineSubscription);

        // Follows
        const followSubscription = this._eventSubListener.onChannelFollow(streamer.userId, streamer.userId, (event) => {
            twitchEventsHandler.follow.triggerFollow(
                event.userName,
                event.userId,
                event.userDisplayName
            );
        });
        this._subscriptions.push(followSubscription);

        // Cheers
        const bitsSubscription = this._eventSubListener.onChannelCheer(streamer.userId, async (event) => {
            const totalBits = (await twitchApi.bits.getChannelBitsLeaderboard(1, "all", new Date(), event.userId))[0]?.amount ?? 0;

            twitchEventsHandler.cheer.triggerCheer(
                event.userName ?? "ananonymouscheerer",
                event.userId,
                event.userDisplayName ?? "An Anonymous Cheerer",
                event.isAnonymous,
                event.bits,
                totalBits,
                event.message ?? ""
            );
        });
        this._subscriptions.push(bitsSubscription);

        // Channel custom reward
        const customRewardRedemptionSubscription = this._eventSubListener.onChannelRedemptionAdd(streamer.userId, async (event) => {
            const reward = await twitchApi.channelRewards.getCustomChannelReward(event.rewardId);
            let imageUrl = "";

            if (reward && reward.defaultImage) {
                const images = reward.defaultImage;
                if (images.url4x) {
                    imageUrl = images.url4x;
                } else if (images.url2x) {
                    imageUrl = images.url2x;
                } else if (images.url1x) {
                    imageUrl = images.url1x;
                }
            }

            twitchEventsHandler.rewardRedemption.handleRewardRedemption(
                event.id,
                event.status,
                !reward.shouldRedemptionsSkipRequestQueue,
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

            if (!reward.shouldRedemptionsSkipRequestQueue) {
                rewardManager.refreshChannelRewardRedemptions();
            }
        });
        this._subscriptions.push(customRewardRedemptionSubscription);

        const customRewardRedemptionUpdateSubscription = this._eventSubListener.onChannelRedemptionUpdate(streamer.userId, async (event) => {
            const reward = await twitchApi.channelRewards.getCustomChannelReward(event.rewardId);
            let imageUrl = "";

            if (reward && reward.defaultImage) {
                const images = reward.defaultImage;
                if (images.url4x) {
                    imageUrl = images.url4x;
                } else if (images.url2x) {
                    imageUrl = images.url2x;
                } else if (images.url1x) {
                    imageUrl = images.url1x;
                }
            }

            twitchEventsHandler.rewardRedemption.handleRewardUpdated(
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

            rewardManager.refreshChannelRewardRedemptions();
        });
        this._subscriptions.push(customRewardRedemptionUpdateSubscription);

        // Raid
        const raidSubscription = this._eventSubListener.onChannelRaidTo(streamer.userId, (event) => {
            twitchEventsHandler.raid.triggerRaid(
                event.raidingBroadcasterName,
                event.raidingBroadcasterId,
                event.raidingBroadcasterDisplayName,
                event.viewers
            );
        });
        this._subscriptions.push(raidSubscription);

        // Shoutout sent to another channel
        const shoutoutSentSubscription = this._eventSubListener.onChannelShoutoutCreate(streamer.userId, streamer.userId, (event) => {
            twitchEventsHandler.shoutout.triggerShoutoutSent(
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
            twitchEventsHandler.shoutout.triggerShoutoutReceived(
                event.shoutingOutBroadcasterName,
                event.shoutingOutBroadcasterId,
                event.shoutingOutBroadcasterDisplayName,
                event.viewerCount
            );
        });
        this._subscriptions.push(shoutoutReceivedSubscription);

        // Hype Train start
        const hypeTrainBeginSubscription = this._eventSubListener.onChannelHypeTrainBegin(streamer.userId, (event) => {
            twitchEventsHandler.hypeTrain.triggerHypeTrainStart(
                event.total,
                event.progress,
                event.goal,
                event.level,
                event.startDate,
                event.expiryDate,
                event.lastContribution,
                event.topContributors
            );
        });
        this._subscriptions.push(hypeTrainBeginSubscription);

        // Hype Train progress
        const hypeTrainProgressSubscription = this._eventSubListener.onChannelHypeTrainProgress(streamer.userId, (event) => {
            twitchEventsHandler.hypeTrain.triggerHypeTrainProgress(
                event.total,
                event.progress,
                event.goal,
                event.level,
                event.startDate,
                event.expiryDate,
                event.lastContribution,
                event.topContributors
            );
        });
        this._subscriptions.push(hypeTrainProgressSubscription);

        // Hype Train end
        const hypeTrainEndSubscription = this._eventSubListener.onChannelHypeTrainEnd(streamer.userId, (event) => {
            twitchEventsHandler.hypeTrain.triggerHypeTrainEnd(
                event.total,
                event.level,
                event.startDate,
                event.endDate,
                event.cooldownEndDate,
                event.topContributors
            );
        });
        this._subscriptions.push(hypeTrainEndSubscription);

        // Channel goal begin
        const channelGoalBeginSubscription = this._eventSubListener.onChannelGoalBegin(streamer.userId, (event) => {
            twitchEventsHandler.goal.triggerChannelGoalBegin(
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
            twitchEventsHandler.goal.triggerChannelGoalProgress(
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
            twitchEventsHandler.goal.triggerChannelGoalEnd(
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
            twitchEventsHandler.poll.triggerChannelPollBegin(
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
            twitchEventsHandler.poll.triggerChannelPollProgress(
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
                twitchEventsHandler.poll.triggerChannelPollEnd(
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
            twitchEventsHandler.prediction.triggerChannelPredictionBegin(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionBeginSubscription);

        // Channel prediction progress
        const predictionProgressSubscription = this._eventSubListener.onChannelPredictionProgress(streamer.userId, (event) => {
            twitchEventsHandler.prediction.triggerChannelPredictionProgress(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionProgressSubscription);

        // Channel prediction lock
        const predictionLockSubscription = this._eventSubListener.onChannelPredictionLock(streamer.userId, (event) => {
            twitchEventsHandler.prediction.triggerChannelPredictionLock(
                event.title,
                event.outcomes,
                event.startDate,
                event.lockDate
            );
        });
        this._subscriptions.push(predictionLockSubscription);

        // Channel prediction end
        const predictionEndSubscription = this._eventSubListener.onChannelPredictionEnd(streamer.userId, (event) => {
            twitchEventsHandler.prediction.triggerChannelPredictionEnd(
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
                twitchEventsHandler.viewerTimeout.triggerTimeout(
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
                twitchEventsHandler.viewerBanned.triggerBanned(
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

        // Unban
        const unbanSubscription = this._eventSubListener.onChannelUnban(streamer.userId, (event) => {
            twitchEventsHandler.viewerBanned.triggerUnbanned(
                event.userName,
                event.userId,
                event.userDisplayName,
                event.moderatorName,
                event.moderatorId,
                event.moderatorDisplayName
            );
        });
        this._subscriptions.push(unbanSubscription);

        // Charity Campaign Start
        const charityCampaignStartSubscription = this._eventSubListener.onChannelCharityCampaignStart(streamer.userId, (event) => {
            twitchEventsHandler.charity.triggerCharityCampaignStart(
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
            twitchEventsHandler.charity.triggerCharityDonation(
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
            twitchEventsHandler.charity.triggerCharityCampaignProgress(
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
            twitchEventsHandler.charity.triggerCharityCampaignEnd(
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

        // Moderator added
        const channelModeratorAddSubscription = this._eventSubListener.onChannelModeratorAdd(streamer.userId, (event) => {
            chatRolesManager.addModeratorToModeratorsList({
                id: event.userId,
                username: event.userName,
                displayName: event.userDisplayName
            });
        });
        this._subscriptions.push(channelModeratorAddSubscription);

        // Moderator removed
        const channelModeratorRemoveSubscription = this._eventSubListener.onChannelModeratorRemove(streamer.userId, (event) => {
            chatRolesManager.removeModeratorFromModeratorsList(event.userId);
        });
        this._subscriptions.push(channelModeratorRemoveSubscription);

        // Ad break start/end
        const channelAdBreakBeginSubscription = this._eventSubListener.onChannelAdBreakBegin(streamer.userId, (event) => {
            twitchEventsHandler.ad.triggerAdBreakStart(
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
                twitchEventsHandler.ad.triggerAdBreakEnd(
                    event.requesterName,
                    event.requesterId,
                    event.requesterDisplayName,
                    event.durationSeconds,
                    event.isAutomatic
                );
            }, adBreakEndTime.getTime() - (new Date()).getTime());
        });
        this._subscriptions.push(channelAdBreakBeginSubscription);
    }

    async createClient(): Promise<void> {
        this.disconnectEventSub();

        logger.info("Connecting to Twitch EventSub...");

        try {
            this._eventSubListener = new EventSubWsListener({
                apiClient: twitchApi.streamerClient
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

export = new TwitchEventSubClient();
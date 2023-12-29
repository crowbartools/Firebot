import { EventSubSubscription } from "@twurple/eventsub-base";
import { EventSubWsListener } from "@twurple/eventsub-ws";

import logger from "../../logwrapper";
import accountAccess from "../../common/account-access";
import frontendCommunicator from "../../common/frontend-communicator";
import twitchEventsHandler from '../../events/twitch-events';
import TwitchApi from "../api";
import twitchStreamInfoPoll from "../stream-info-manager";

class TwitchEventSubClient {
    private _eventSubListener: EventSubWsListener;
    private _subscriptions: Array<EventSubSubscription> = [];

    async createClient(): Promise<void> {
        const streamer = accountAccess.getAccounts().streamer;

        await this.disconnectEventSub();

        logger.info("Connecting to Twitch EventSub...");

        try {
            this._eventSubListener = new EventSubWsListener({
                apiClient: TwitchApi.streamerClient
            });

            this._eventSubListener.start();

            // Stream online
            const onlineSubscription = this._eventSubListener.onStreamOnline(streamer.userId, (event) => {
                twitchEventsHandler.stream.triggerStreamOnline(
                    event.broadcasterId,
                    event.broadcasterName,
                    event.broadcasterDisplayName
                );
            });
            this._subscriptions.push(onlineSubscription);

            // Stream offline
            const offlineSubscription = this._eventSubListener.onStreamOffline(streamer.userId, (event) => {
                twitchEventsHandler.stream.triggerStreamOffline(
                    event.broadcasterId,
                    event.broadcasterName,
                    event.broadcasterDisplayName
                );
            });
            this._subscriptions.push(offlineSubscription);

            // Follows
            const followSubscription = this._eventSubListener.onChannelFollow(streamer.userId, streamer.userId, (event) => {
                twitchEventsHandler.follow.triggerFollow(
                    event.userId,
                    event.userName,
                    event.userDisplayName
                );
            });
            this._subscriptions.push(followSubscription);

            // Cheers
            const bitsSubscription = this._eventSubListener.onChannelCheer(streamer.userId, async (event) => {
                const totalBits = (await TwitchApi.bits.getChannelBitsLeaderboard(1, "all", new Date(), event.userId))[0]?.amount ?? 0;

                twitchEventsHandler.cheer.triggerCheer(
                    event.userDisplayName ?? "An Anonymous Cheerer",
                    event.userId,
                    event.isAnonymous,
                    event.bits,
                    totalBits,
                    event.message ?? ""
                );
            });
            this._subscriptions.push(bitsSubscription);

            // Channel custom reward
            const customRewardRedemptionSubscription = this._eventSubListener.onChannelRedemptionAdd(streamer.userId, async (event) => {
                const reward = await TwitchApi.channelRewards.getCustomChannelReward(event.rewardId);
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
            });
            this._subscriptions.push(customRewardRedemptionSubscription);

            // Raid
            const raidSubscription = this._eventSubListener.onChannelRaidTo(streamer.userId, (event) => {
                twitchEventsHandler.raid.triggerRaid(
                    event.raidedBroadcasterName,
                    event.raidedBroadcasterId,
                    event.raidingBroadcasterDisplayName,
                    event.viewers
                );
            });
            this._subscriptions.push(raidSubscription);

            // Shoutout sent to another channel
            const shoutoutSentSubscription = this._eventSubListener.onChannelShoutoutCreate(streamer.userId, streamer.userId, (event) => {
                twitchEventsHandler.shoutout.triggerShoutoutSent(
                    event.shoutedOutBroadcasterDisplayName,
                    event.moderatorDisplayName,
                    event.viewerCount
                );
            });
            this._subscriptions.push(shoutoutSentSubscription);

            // Shoutout received from another channel
            const shoutoutReceivedSubscription = this._eventSubListener.onChannelShoutoutReceive(streamer.userId, streamer.userId, (event) => {
                twitchEventsHandler.shoutout.triggerShoutoutReceived(
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
                        event.userDisplayName,
                        timeoutDuration,
                        event.moderatorName,
                        event.reason
                    );
                } else {
                    twitchEventsHandler.viewerBanned.triggerBanned(
                        event.userDisplayName,
                        event.moderatorName,
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
                    event.moderatorName
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
        } catch (error) {
            logger.error("Failed to connect to Twitch EventSub", error);
            return;
        }

        logger.info("Connected to the Twitch EventSub!");
    }

    async removeSubscriptions(): Promise<void> {
        this._subscriptions = [];
    }

    async disconnectEventSub(): Promise<void> {
        await this.removeSubscriptions();
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
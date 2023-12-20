import eventManager from "../EventManager";
import {
    EventSubChannelPollBeginChoice,
    EventSubChannelPollChoice,
    EventSubChannelPollEndStatus
} from "@twurple/eventsub-base";

export function triggerChannelPollBegin(
    title: string,
    choices: EventSubChannelPollBeginChoice[],
    startDate: Date,
    endDate: Date,
    isChannelPointsVotingEnabled: boolean,
    channelPointsPerVote: number
) {
    eventManager.triggerEvent("twitch", "channel-poll-begin", {
        title,
        choices,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote
    });
}

export function triggerChannelPollProgress(
    title: string,
    choices: EventSubChannelPollChoice[],
    startDate: Date,
    endDate: Date,
    isChannelPointsVotingEnabled: boolean,
    channelPointsPerVote: number
) {
    eventManager.triggerEvent("twitch", "channel-poll-progress", {
        title,
        choices,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote
    });
}

export function triggerChannelPollEnd(
    title: string,
    choices: EventSubChannelPollChoice[],
    startDate: Date,
    endDate: Date,
    isChannelPointsVotingEnabled: boolean,
    channelPointsPerVote: number,
    status: EventSubChannelPollEndStatus
) {
    const winningChoice = choices.sort((c1: EventSubChannelPollChoice, c2:EventSubChannelPollChoice) => {
        return c1.totalVotes < c2.totalVotes ? 1 : -1;
    })[0];

    eventManager.triggerEvent("twitch", "channel-poll-end", {
        title,
        choices,
        winningChoice,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status
    });
}
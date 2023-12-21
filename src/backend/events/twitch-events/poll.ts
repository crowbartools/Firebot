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
    const winningChoiceVotes = Math.max(...choices.map(c => c.totalVotes));

    // Multiple choices in the poll may win, so we return all
    const winningChoiceName = choices
        .filter(c => c.totalVotes === winningChoiceVotes)
        .map(c => c.title)
        .join(", ");

    eventManager.triggerEvent("twitch", "channel-poll-end", {
        title,
        choices,
        winningChoiceName,
        winningChoiceVotes,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status
    });
}
import { pick } from "../../utils";
import eventManager from "../EventManager";
import {
    EventSubChannelPollBeginChoice,
    EventSubChannelPollChoice,
    EventSubChannelPollEndStatus
} from "@twurple/eventsub-base";

interface TwitchPollWinningChoice {
    winningChoiceName: string;
    winningChoiceVotes: number;
}

function getWinningChoices(choices: EventSubChannelPollChoice[]): TwitchPollWinningChoice {
    const winningChoiceVotes = Math.max(...choices.map(c => c.totalVotes));

    // Multiple choices in the poll may be winning, so we return all
    const winningChoiceName = choices
        .filter(c => c.totalVotes === winningChoiceVotes)
        .map(c => c.title)
        .join(", ");

    return {
        winningChoiceName,
        winningChoiceVotes
    };
}

function mapChoices(choices: Array<EventSubChannelPollChoice>) {
    return choices.map(c => pick(c, ["id", "title", "totalVotes", "channelPointsVotes"]));
}

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
        choices: choices.map(c => pick(c, ["id", "title"])),
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
    const { winningChoiceName, winningChoiceVotes } = getWinningChoices(choices);


    eventManager.triggerEvent("twitch", "channel-poll-progress", {
        title,
        choices: mapChoices(choices),
        winningChoiceName,
        winningChoiceVotes,
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
    const { winningChoiceName, winningChoiceVotes } = getWinningChoices(choices);

    eventManager.triggerEvent("twitch", "channel-poll-end", {
        title,
        choices: mapChoices(choices),
        winningChoiceName,
        winningChoiceVotes,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status
    });
}
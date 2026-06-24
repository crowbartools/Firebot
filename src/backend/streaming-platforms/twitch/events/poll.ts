import {
    EventSubChannelPollBeginChoice,
    EventSubChannelPollChoice,
    EventSubChannelPollEndStatus
} from "@twurple/eventsub-base";
import { EventManager } from "../../../events/event-manager";
import { pick } from "../../../utils";
import { InternalBus } from "../../../internal-bus";

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
    const mappedChoices = choices.map(c => pick(c, ["id", "title"]));

    void EventManager.triggerEvent("twitch", "channel-poll-begin", {
        title,
        choices: mappedChoices,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote
    });

    InternalBus.emit("channel-poll-begin", {
        title,
        choices: mappedChoices.map(c => ({ ...c, totalVotes: 0, channelPointsVotes: 0 })),
        winningChoiceIds: [],
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status: "active"
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

    const mappedChoices = mapChoices(choices);
    const winningChoiceIds = mappedChoices.filter(c => c.totalVotes === winningChoiceVotes).map(c => c.id);

    void EventManager.triggerEvent("twitch", "channel-poll-progress", {
        title,
        choices: mappedChoices,
        winningChoiceName,
        winningChoiceVotes,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote
    });

    InternalBus.emit("channel-poll-progress", {
        title,
        choices: mappedChoices,
        winningChoiceIds,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status: "active"
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

    const mappedChoices = mapChoices(choices);
    const winningChoiceIds = mappedChoices.filter(c => c.totalVotes === winningChoiceVotes).map(c => c.id);

    void EventManager.triggerEvent("twitch", "channel-poll-end", {
        title,
        choices: mappedChoices,
        winningChoiceName,
        winningChoiceVotes,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status
    });

    InternalBus.emit("channel-poll-end", {
        title,
        choices: mappedChoices,
        winningChoiceIds,
        startDate,
        endDate,
        isChannelPointsVotingEnabled,
        channelPointsPerVote,
        status
    });
}
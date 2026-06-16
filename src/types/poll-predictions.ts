import type { EventSubChannelPollChoice } from "@twurple/eventsub-base/lib";

type ChannelPollChoice = Pick<EventSubChannelPollChoice, "id" | "title" | "totalVotes" | "channelPointsVotes">;

export type ChannelPoll = {
    title: string;
    startDate: Date;
    endDate: Date;
    choices: ChannelPollChoice[];
    winningChoiceIds: string[];
    isChannelPointsVotingEnabled: boolean;
    channelPointsPerVote: number;
    status: "active" | "completed" | "archived" | "terminated";
};

type ChannelPredictionOutcome = {
    id: string;
    title: string;
    channelPoints: number;
    users: number;
    color?: "blue" | "pink";
};

export type ChannelPrediction = {
    title: string;
    startDate: Date;
    lockDate: Date;
    outcomes: ChannelPredictionOutcome[];
    winningOutcomeId: string | null;
    status: "active" | "locked" | "resolved" | "canceled";
};

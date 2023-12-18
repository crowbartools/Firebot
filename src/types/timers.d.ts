import { Moment } from "moment";

export type Timer = {
    id: string;
    name: string;
    active: boolean;
    interval: number;
    requiredChatLines: number;
    onlyWhenLive: boolean;
    effects: {
        id: string;
        list: any[];
    };
    sortTags: string[];
};

export type TimerIntervalTracker = {
    timerId: string;
    onlyWhenLive: boolean;
    timer: Timer;
    requiredChatLines: number;
    waitingForChatLines: boolean;
    chatLinesSinceLastRunCount: number;
    intervalId: number | NodeJS.Timeout;
    startedAt: Moment;
};
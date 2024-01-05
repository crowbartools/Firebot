import { Moment } from "moment";
import { EffectList } from "./effects";

export type Timer = {
    id: string;
    name: string;
    active: boolean;
    interval: number;
    requiredChatLines: number;
    onlyWhenLive: boolean;
    effects: EffectList;
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

export type ScheduledTask = {
    id: string;
    name: string;
    enabled: boolean;
    schedule: string;
    inputType: string;
    onlyWhenLive: boolean;
    effects: EffectList[];
    sortTags: string[];
};
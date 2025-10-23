import type { TwitchApi } from "../api";
import type { Awaitable } from "../../../../types/util-types";

export type TwitchSlashCommandValidationResult<Args extends unknown[] = unknown[]> = {
    success: true;
    args: Args;
} | {
    success: false;
    foundCommand?: boolean;
    errorMessage: string;
};

export type TwitchSlashCommand<Args extends unknown[] = unknown[]> = {
    commands: string[];
    validateArgs(rawArgs: string[]): TwitchSlashCommandValidationResult<Args>;
    handle(twitchApi: typeof TwitchApi, sendAsBot?: boolean, ...args: Args): Awaitable<boolean>;
};
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
    handle(args: Args, sendAsBot?: boolean): boolean | PromiseLike<boolean>;
};
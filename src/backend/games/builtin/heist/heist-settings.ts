import { RoleNumberParameterValue, RolePercentageParameterValue } from "../../../../types/game-manager";

export type HeistSettings = {
    currencySettings: {
        currencyId: string;
        defaultWager?: number;
        minWager?: number;
        maxWager?: number;
    };
    successChanceSettings: {
        successChances: RolePercentageParameterValue;
    };
    winningsMultiplierSettings: {
        multipliers: RoleNumberParameterValue;
    };
    generalSettings: {
        minimumUsers?: number;
        startDelay?: number;
        cooldown?: number;
    };
    entryMessages: {
        onJoin?: string;
        alreadyJoined?: string;
        noWagerAmount?: string;
        invalidWagerAmount?: string;
        wagerAmountTooLow?: string;
        wagerAmountTooHigh?: string;
        notEnoughToWager?: string;
    };
    generalMessages: {
        teamCreation?: string;
        onCooldown?: string;
        cooldownOver?: string;
        startMessage?: string;
        teamTooSmall?: string;
        heistWinnings?: string;
    };
    groupOutcomeMessages: {
        hundredPercent: string[];
        top25Percent: string[];
        mid50Percent: string[];
        bottom25Percent: string[];
        zeroPercent: string[];
    };
    soloOutcomeMessages: {
        soloSuccess: string[];
        soloFail: string[];
    };
    chatSettings: {
        chatter: "Streamer" | "Bot";
    };
};

import { RolePercentageParameterValue } from "../../../../types/game-manager";

export type SlotSettings = {
    currencySettings: {
        currencyId: string;
        defaultWager?: number;
        minWager?: number;
        maxWager?: number;
    };
    spinSettings: {
        successChances: RolePercentageParameterValue;
        multiplier: number;
    };
    cooldownSettings: {
        cooldown?: number;
    };
    generalMessages: {
        alreadySpinning?: string;
        onCooldown?: string;
        noWagerAmount?: string;
        invalidWagerAmount?: string;
        moreThanZero?: string;
        minWager?: string;
        maxWager?: string;
        notEnough?: string;
        spinInAction?: string;
        spinSuccessful?: string;
    };
    chatSettings: {
        chatter: "Streamer" | "Bot";
    };
};

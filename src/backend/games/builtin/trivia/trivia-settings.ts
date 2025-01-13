import { RoleNumberParameterValue } from "../../../../types/game-manager";
import { Difficulty, QuestionType } from "./trivia-helper";

export type TriviaSettings = {
    currencySettings: {
        currencyId: string;
        defaultWager?: number;
        minWager?: number;
        maxWager?: number;
    };
    questionSettings: {
        enabledCategories: number[];
        enabledDifficulties: Difficulty[];
        enabledTypes: QuestionType[];
        answerTime: number;
    };
    multiplierSettings: {
        easyMultipliers: RoleNumberParameterValue;
        mediumMultipliers: RoleNumberParameterValue;
        hardMultipliers: RoleNumberParameterValue;
    };
    cooldownSettings: {
        cooldown?: number;
    };
    chatSettings: {
        chatter: "Streamer" | "Bot";
        noWagerMessage: string;
        postCorrectAnswer: boolean;
    };
};

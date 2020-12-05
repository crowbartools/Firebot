import { FirebotActionType } from ".";

export type FirebotAction<Properties extends Record<string, unknown>> = {
    id: string;
    type: FirebotActionType["id"];
} & Properties;

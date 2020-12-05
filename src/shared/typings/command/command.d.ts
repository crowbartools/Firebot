import { FirebotActionList } from "SharedTypes/action";

export interface FirebotCustomCommand {
    active: boolean;
    id: string;
    trigger: string;
    scanWholeMessage: boolean;
    actionList: FirebotActionList;
}

import { ReplaceVariableManager } from "./replace-variable-manager";

import builtinVariables from "./builtin";
import twitchVariables from "../streaming-platforms/twitch/variables";

export const loadReplaceVariables = () => {
    for (const definition of builtinVariables) {
        ReplaceVariableManager.registerReplaceVariable(definition);
    }

    for (const definition of twitchVariables) {
        ReplaceVariableManager.registerReplaceVariable(definition);
    }
};
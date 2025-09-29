import manager from "./replace-variable-manager";

import builtinVariables from "./builtin";
import twitchVariables from "../streaming-platforms/twitch/variables";


export const loadReplaceVariables = () => {
    for (const definition of builtinVariables) {
        manager.registerReplaceVariable(definition);
    }

    for (const definition of twitchVariables) {
        manager.registerReplaceVariable(definition);
    }
};
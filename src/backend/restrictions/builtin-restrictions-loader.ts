import { RestrictionsManager } from "./restriction-manager";
import builtinRestrictions from "./builtin";

export const loadRestrictions = () => {
    for (const restriction of builtinRestrictions) {
        RestrictionsManager.registerRestriction(restriction);
    }
};
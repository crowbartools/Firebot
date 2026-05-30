import type { ScriptTwitchApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

import { TwitchApi } from "../../../streaming-platforms/twitch/api";

export const createTwitchApi = defineScriptApiNamespace<ScriptTwitchApi>(() => {
    return {
        api: TwitchApi
    };
});

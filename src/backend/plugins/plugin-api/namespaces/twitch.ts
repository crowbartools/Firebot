import type { PluginTwitchApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import { TwitchApi } from "../../../streaming-platforms/twitch/api";

export const createTwitchApi = definePluginApiNamespace<PluginTwitchApi>(() => {
    return {
        api: TwitchApi
    };
});

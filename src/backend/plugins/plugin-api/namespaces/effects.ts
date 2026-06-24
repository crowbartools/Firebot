import type { PluginEffectsApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";
import effectRunner from "../../../common/effect-runner";

export const createEffectsApi = definePluginApiNamespace<PluginEffectsApi>(() => {
    return {
        processEffects(context) {
            return effectRunner.processEffects(context);
        }
    };
});

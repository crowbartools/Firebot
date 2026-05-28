import type { ScriptEffectsApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";
import effectRunner from "../../../common/effect-runner";

import { EffectManager } from "../../../effects/effect-manager";

export const createEffectsApi = defineScriptApiNamespace<ScriptEffectsApi>(() => {
    return {
        addEventToEffect(effectId, eventSourceId, eventId) {
            EffectManager.addEventToEffect(effectId, eventSourceId, eventId);
        },

        removeEventFromEffect(effectId, eventSourceId, eventId) {
            EffectManager.removeEventFromEffect(effectId, eventSourceId, eventId);
        },

        processEffects(context) {
            return effectRunner.processEffects(context);
        }
    };
});

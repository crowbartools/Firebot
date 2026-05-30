import type { ScriptFrontendCommunicatorApi } from "../../../../types/script-api";
import { defineScriptApiNamespace } from "../internal/define-namespace";

import frontendCommunicator from "../../../common/frontend-communicator";

export const createFrontendCommunicatorApi = defineScriptApiNamespace<ScriptFrontendCommunicatorApi>((ctx) => {
    return {
        send(eventName, data) {
            frontendCommunicator.send(eventName, data);
        },

        fireEventAsync(eventName, data) {
            return frontendCommunicator.fireEventAsync(eventName, data);
        },

        on(eventName, callback) {
            const id = frontendCommunicator.on(eventName, callback);
            const unsubscribe = () => frontendCommunicator.off(eventName, id);
            ctx.onDispose(unsubscribe);
            return unsubscribe;
        },

        onAsync(eventName, callback) {
            const id = frontendCommunicator.onAsync(eventName, callback);
            const unsubscribe = () => frontendCommunicator.off(eventName, id);
            ctx.onDispose(unsubscribe);
            return unsubscribe;
        }
    };
});

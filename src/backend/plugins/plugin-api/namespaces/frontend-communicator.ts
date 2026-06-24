import type { PluginFrontendCommunicatorApi } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import frontendCommunicator from "../../../common/frontend-communicator";

export const createFrontendCommunicatorApi = definePluginApiNamespace<PluginFrontendCommunicatorApi>(() => {
    return {
        send(eventName, data) {
            frontendCommunicator.send(eventName, data);
        },

        fireEventAsync(eventName, data) {
            return frontendCommunicator.fireEventAsync(eventName, data);
        }
    };
});

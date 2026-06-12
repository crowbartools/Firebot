import type { SystemQuickAction } from "../../../types";

import frontendCommunicator from "../../common/frontend-communicator";

const StreamInfoQuickAction: SystemQuickAction = {
    definition: {
        id: "firebot:stream-info",
        name: "Edit Stream Info",
        type: "system",
        icon: "far fa-pencil"
    },
    onTriggerEvent: () => {
        frontendCommunicator.send("trigger-quickaction:stream-info");
    }
};

export { StreamInfoQuickAction };
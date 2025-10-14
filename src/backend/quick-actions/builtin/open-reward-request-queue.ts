import { SystemQuickAction } from "../../../types/quick-actions";
import frontendCommunicator from "../../common/frontend-communicator";

const OpenRewardQueueQuickAction: SystemQuickAction = {
    definition: {
        id: "firebot:open-reward-request-queue",
        name: "Open Reward Request Queue",
        type: "system",
        icon: "far fa-line-columns"
    },
    onTriggerEvent: () => {
        frontendCommunicator.send("trigger-quickaction:reward-queue");
    }
};

export { OpenRewardQueueQuickAction };
import { SystemQuickAction } from "../../../types/quick-actions";
import frontendCommunicator from "../../common/frontend-communicator";

const StreamScheduleQuickAction: SystemQuickAction = {
    definition: {
        id: "firebot:stream-schedule",
        name: "Edit Stream Schedule",
        type: "system",
        icon: "far fa-calendar-alt"
    },
    onTriggerEvent: () => {
        frontendCommunicator.send("trigger-quickaction:stream-schedule");
    }
};

export { StreamScheduleQuickAction };
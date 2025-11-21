import { SystemQuickAction } from "../../../types/quick-actions";
import windowManagement from "../../app-management/electron/window-management";

const StreamPreviewQuickAction: SystemQuickAction = {
    definition: {
        id: "firebot:stream-preview",
        name: "Open Stream Preview",
        type: "system",
        icon: "far fa-tv-alt"
    },
    onTriggerEvent: () => {
        windowManagement.createStreamPreviewWindow();
    }
};

export { StreamPreviewQuickAction };
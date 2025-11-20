import type { EffectType } from '../../../types/effects';
import frontendCommunicator from "../../common/frontend-communicator";

const effect: EffectType = {
    definition: {
        id: "firebot:mark-all-activity-acknowledged",
        name: "Mark All Activity As Acknowledged",
        description: "Marks all Activity as acknowledged on the Chat page",
        icon: "fad fa-comment-dots",
        categories: ["common", "dashboard"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container pad-top="true">
            <p>When this effect is ran, all activity in the Activity Feed on the Chat page will be marked as acknowledged. Useful on a hotkey or hooked up to a Stream Deck to quickly acknowledge all current activity.</p>
        </eos-container>
    `,
    onTriggerEvent: () => {
        frontendCommunicator.send("activity-feed:acknowledge-all-activity");
        return true;
    }
};

export = effect;
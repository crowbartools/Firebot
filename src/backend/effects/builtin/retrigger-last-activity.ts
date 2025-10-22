import { EffectType } from "../../../types/effects";
import { retriggerLastActivity } from "../../events/activity-feed-manager";

const effect: EffectType = {
    definition: {
        id: "firebot:retrigger-last-activity",
        name: "Retrigger Last Activity",
        description: "Retrigger the most recent event in the Dashboard Activity Feed",
        icon: "fad fa-redo",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will retrigger the most recent event in the Dashboard Activity Feed. Useful for hooking up to a Hotkey or a Stream Deck.</p>
            <p><strong>Note:</strong> This effect will <em>only</em> retrigger events that are configured to appear in the Activity Feed.</p>
        </eos-container>
    `,
    onTriggerEvent: () => {
        retriggerLastActivity();
    }
};

export = effect;
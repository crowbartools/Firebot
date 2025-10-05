import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import { retriggerLastActivity } from "../../events/activity-feed-manager";

const model: EffectType = {
    definition: {
        id: "firebot:retrigger-last-activity",
        name: "Retrigger Last Activity",
        description: "Retrigger the most recent event in the Dashboard Activity Feed",
        icon: "fad fa-redo",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will retrigger the most recent event in the Dashboard Activity Feed. Useful for hooking up to a Hotkey or a Stream Deck.</p>
            <p><strong>Note:</strong> This effect will <em>only</em> retrigger events that are configured to appear in the Activity Feed.</p>
        </eos-container>
    `,
    onTriggerEvent: async () => {
        retriggerLastActivity();
    }
};

module.exports = model;
import type { EffectType } from "../../../types/effects";
import { ActivityFeedManager } from "../../events/activity-feed-manager";

const effect: EffectType<{
    message: string;
    icon: string;
}> = {
    definition: {
        id: "firebot:activity-feed-alert",
        name: "Activity Feed Alert",
        description: "Display an alert in Firebot's Activity Feed",
        icon: "fad fa-comment-exclamation",
        categories: ["dashboard"],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container>
        <p>Use this effect to send yourself alerts in Firebot's Activity Feed.</p>
    </eos-container>
    <eos-container header="Message" pad-top="true">
        <firebot-input
            model="effect.message"
            placeholder-text="Enter message"
            use-text-area="true"
            rows="4"
            cols="40"
            menu-position="under"
        />
    </eos-container>
    <eos-container header="Icon" pad-top="true">
        <input
			maxlength="2"
			type="text"
			class="form-control"
			ng-model="effect.icon"
			icon-picker required
		/>
    </eos-container>
    `,
    optionsController: () => { },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: ({ effect }) => {
        ActivityFeedManager.handleTriggeredEvent(
            {
                id: "firebot",
                name: "Firebot"
            },
            {
                id: "activity-feed-alert",
                name: "Activity Feed Alert",
                activityFeed: {
                    icon: effect.icon || "fad fa-comment-exclamation",
                    getMessage: () => {
                        return effect.message;
                    }
                }
            },
            {
                username: "firebot"
            },
            {
                forceAllow: true,
                canRetrigger: false
            });

        return true;
    }
};

export = effect;
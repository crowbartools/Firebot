import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import { handleTriggeredEvent } from "../../events/activity-feed-manager";

const effect: EffectType<{
    message: string;
    icon: string;
}> = {
    definition: {
        id: "firebot:activity-feed-alert",
        name: "Activity Feed Alert",
        description: "Display an alert in Firebot's activity feed",
        icon: "fad fa-comment-exclamation",
        categories: [EffectCategory.FUN],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container>
        <p>Use this effect to send yourself alerts in Firebot's activity feed.</p>
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
        const errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        handleTriggeredEvent(
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

module.exports = effect;

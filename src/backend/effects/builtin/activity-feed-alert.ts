import { EffectType } from "../../../types/effects";
import { EffectCategory, EffectDependency } from "../../../shared/effect-constants";
import logger from "../../logwrapper"; 
import moment from "moment";
import { v4 as uuid } from "uuid";
import frontendCommunicator from "./../../common/frontend-communicator";


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
        <p>Use this effect to send yourself alerts in Firebot's activity feed. This alert is are only visible to you if the activity feed is visible.</p>
    </eos-container>
    <eos-container header="Alert Icon" pad-top="true">
        <h3>Icon</h3>
        <p class="muted">A custom icon which allows you to identify your Activity alert.</p>
        <input maxlength="2" type="text" class="form-control" ng-model="effect.icon" icon-picker required>
    </eos-container>
    <eos-container header="Alert Message" pad-top="true">
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
    </eos-container> 
    `,
    optionsController: () => { },
    optionsValidator: effect => {
        const errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {

        frontendCommunicator.send('event-activity', {
           message: effect.message,
            icon: effect.icon ?? "fad fa-tv-alt",
           acknowledged: false,
           event: {
               id: "activity-feed-alert",
               name: "Activity Feed Alert",
           },
           id: uuid(),
           source:{
               id: "firebot",
               name: "Firebot",
           },
           timestamp: moment().format("H:mm"),
        });

        return true;
    }
};

module.exports = effect;

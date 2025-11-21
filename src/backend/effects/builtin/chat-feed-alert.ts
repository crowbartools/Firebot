import { EffectType } from '../../../types/effects';
import frontendCommunicator from '../../common/frontend-communicator';

const effect: EffectType<{
    message: string;
    icon: string;
}> = {
    definition: {
        id: "firebot:chat-feed-alert",
        name: "Chat Feed Alert",
        description: "Display an alert in Firebot's chat feed",
        icon: "fad fa-exclamation-circle",
        categories: ["common", "dashboard", "chat based"],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container>
        <p>Use this effect to send yourself alerts in Firebot's chat feed without using actual chat messages. This means the alerts are only visible to you.</p>
    </eos-container>
    <eos-container header="Alert Message" pad-top="true">
        <firebot-input
            model="effect.message"
            use-text-area="true"
            placeholder-text="Enter message"
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
    optionsController: ($scope) => {
        // Backward compatibility from when the icon was hard-coded
        if ($scope.effect.icon == null || $scope.effect.icon === "") {
            $scope.effect.icon = "fad fa-exclamation-circle";
        }
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        if (effect.icon == null || effect.icon === "") {
            errors.push("Icon can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: (event) => {

        const { effect } = event;

        frontendCommunicator.send("chatUpdate", {
            fbEvent: "ChatAlert",
            message: effect.message,
            icon: effect.icon
        });

        return true;
    }
};

export = effect;
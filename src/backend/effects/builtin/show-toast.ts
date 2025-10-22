import { EffectType } from "../../../types/effects";
import frontendCommunicator from "../../common/frontend-communicator";

const effect: EffectType<{
    alertType: "info" | "success" | "warning" | "danger";
    message: string;
}> = {
    definition: {
        id: "firebot:show-toast",
        name: "Show Toast Notification",
        description: "Displays a toast notification at the top of the Firebot main window.",
        icon: "fad fa-comment-alt-exclamation",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Message Text">
            <p class="muted">Enter the message you would like to display in the toast notification.</p>
            <firebot-input
                title="Message"
                model="effect.message"
                placeholder-text="Enter toast notification text"
                menu-position="under"
            />
        </eos-container>

        <eos-container header="Alert Type" pad-top="true">
            <firebot-select
                options="{ info: 'Info', success: 'Success', warning: 'Warning', danger: 'Danger' }"
                selected="effect.alertType"
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.effect.alertType = $scope.effect.alertType ?? "info";
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!(effect.message?.length > 0)) {
            errors.push("Please input a message.");
        }
        if (effect.alertType == null) {
            errors.push("Please select an alert type.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        frontendCommunicator.send("showToast", {
            content: effect.message,
            className: effect.alertType
        });
    }
};

export = effect;
import type { EffectType } from "../../../types";

import frontendCommunicator from "../../common/frontend-communicator";

const effect: EffectType<{
    alertType: "info" | "success" | "warning" | "danger";
    message: string;
    dismissType: "timeout" | "manual";
    timeout: number;
}> = {
    definition: {
        id: "firebot:show-toast",
        name: "Show Toast Notification",
        description: "Displays a toast notification at the top of the Firebot main window.",
        icon: "fad fa-comment-alt-exclamation",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
    settingsSchema: [
        {
            title: "Toast Notification",
            settings: [
                {
                    name: "message",
                    type: "string",
                    title: "Message Text",
                    default: "",
                    placeholder: "Enter toast notification text"
                },
                {
                    name: "alertType",
                    type: "radio-cards",
                    title: "Alert Type",
                    default: "info",
                    settings: {
                        gridColumns: 4
                    },
                    options: [
                        {
                            label: "Info",
                            value: "info",
                            iconClass: "fa-info-circle"
                        },
                        {
                            label: "Success",
                            value: "success",
                            iconClass: "fa-check-circle"
                        },
                        {
                            label: "Warning",
                            value: "warning",
                            iconClass: "fa-exclamation-triangle"
                        },
                        {
                            label: "Danger",
                            value: "danger",
                            iconClass: "fa-times-circle"
                        }
                    ]
                },
                {
                    name: "dismissType",
                    type: "radio-cards",
                    title: "Dismiss Type",
                    default: "timeout",
                    settings: {
                        gridColumns: 2
                    },
                    options: [
                        {
                            label: "Automatic",
                            value: "timeout",
                            iconClass: "fa-clock"
                        },
                        {
                            label: "Manually Close",
                            value: "manual",
                            iconClass: "fa-mouse-pointer"
                        }
                    ]
                },
                {
                    name: "timeout",
                    type: "number",
                    title: "Timeout (in seconds)",
                    placeholder: "Enter duration",
                    showIf: {
                        dismissType: "timeout"
                    }
                }
            ]
        }
    ],
    optionsController: ($scope) => {
        $scope.effect.alertType ??= "info";
        $scope.effect.dismissType ??= "timeout";
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!(effect.message?.length > 0)) {
            errors.push("Please input a message.");
        }
        if (effect.alertType == null) {
            errors.push("Please select an alert type.");
        }
        if (effect.dismissType === "timeout" && !effect.timeout) {
            errors.push("Please enter a timeout duration.");
        }
        return errors;
    },
    onTriggerEvent: ({ effect }) => {
        frontendCommunicator.send("showToast", {
            content: effect.message,
            className: effect.alertType,
            dismissOnTimeout: effect.dismissType === "timeout",
            timeout: effect.dismissType === "timeout"
                ? effect.timeout * 1000
                : undefined
        });
    }
};

export = effect;
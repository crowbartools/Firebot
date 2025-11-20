"use strict";

import type {
    FirebotComponent,
    EffectDefinition
} from "../../../../../types";

type Bindings = {
    effectId: string;
    effectDefinition?: EffectDefinition;
};

type Controller = {
    effectId: string;
    effectDefinition?: EffectDefinition;
    getEffectIconClass: () => string;
    getEffectIconStyle: () => { [key: string]: string };
};

(function () {
    const effectIcon: FirebotComponent<Bindings, Controller> = {
        bindings: {
            effectId: "<",
            effectDefinition: "<?"
        },
        template: `
            <div class="effect-icon" ng-style="$ctrl.getEffectIconStyle()">
                <i ng-class="$ctrl.getEffectIconClass()"></i>
            </div>
        `,
        controller: function () {
            const $ctrl = this;

            $ctrl.getEffectIconClass = () => {
                const icon = $ctrl.effectDefinition?.icon?.replace("fad", "fas") ?? "fas fa-exclamation-triangle";
                return icon;
            };

            $ctrl.getEffectIconStyle = () => {
                const categories = $ctrl.effectDefinition?.categories ?? [];

                let color: string | undefined = undefined;
                if ($ctrl.effectId === "firebot:comment") {
                    color = "#f4d03f";
                } else if (categories.includes("moderation")) {
                    color = "#ef4444";
                } else if (categories.includes("dashboard")) {
                    color = "#ff9900ff";
                } else if (categories.includes("chat based")) {
                    color = "#60A5FA";
                } else if (categories.includes("twitch")) {
                    color = "#ab73ff";
                } else if (categories.includes("overlay")) {
                    color = "#F472B6";
                } else if (categories.includes("trigger control")) {
                    color = "#09ff00ff";
                } else if (categories.includes("scripting")) {
                    color = "#FACC15";
                } else if (categories.includes("fun")) {
                    color = "#4ADE80";
                } else if (categories.includes("integrations")) {
                    color = "#00ffd8";
                } else if (categories.includes("advanced")) {
                    color = undefined;
                }

                if (!color) {
                    return {};
                }

                // Convert hex color to rgba with 0.1 alpha for background
                const hexToRgba = (hex: string) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, 0.1)`;
                };

                return {
                    "--effect-icon-color": color,
                    "--effect-icon-bg-color": hexToRgba(color)
                };
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("effectIcon", effectIcon);
})();

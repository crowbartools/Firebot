"use strict";

import type { FirebotComponent, PluginIcon } from "../../../../types";

type Bindings = {
    pluginIcon?: PluginIcon;
};

type Controller = {
    iconContainerStyle: Record<string, string>;
};

(function () {
    const pluginIcon: FirebotComponent<Bindings, Controller> = {
        bindings: {
            pluginIcon: "<?"
        },
        template: `
            <div
                ng-style="$ctrl.iconContainerStyle"
                style="width: 42px; height: 42px; border-radius: 8px; display:flex; align-items:center; justify-content:center; flex-shrink: 0;"
            >
                <i
                    ng-if="$ctrl.pluginIcon.type === 'font-awesome'"
                    class="fas"
                    ng-class="$ctrl.pluginIcon.name"
                    style="font-size: 18px;"
                ></i>
                <img
                    ng-if="$ctrl.pluginIcon.type === 'custom'"
                    ng-src="{{$ctrl.pluginIcon.url}}"
                    alt="Plugin Icon"
                    style="max-width: 24px; max-height: 24px; width: auto; height: auto; object-fit: contain;"
                />
            </div>
        `,
        controller: function () {
            const $ctrl = this;

            const DEFAULT_COLOR = "#53afff";
            const DEFAULT_ICON_CLASS = "fa-puzzle-piece";

            $ctrl.iconContainerStyle = {};

            function cssColorToRGBA(colorString: string): { r: number, g: number, b: number, alpha: number } {
                // Create a 1x1 offscreen canvas
                const canvas = new OffscreenCanvas(1, 1);
                const ctx = canvas.getContext("2d");

                ctx.fillStyle = colorString;
                ctx.fillRect(0, 0, 1, 1);

                const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
                return { r, g, b, alpha: a / 255 };
            }

            function updateIconContainerStyle() {
                if ($ctrl.pluginIcon?.type === "font-awesome") {
                    const colorRGBA = cssColorToRGBA($ctrl.pluginIcon.color ?? DEFAULT_COLOR);
                    $ctrl.iconContainerStyle = {
                        color: $ctrl.pluginIcon.color ?? DEFAULT_COLOR,
                        background: colorRGBA ? `rgba(${colorRGBA.r},${colorRGBA.g},${colorRGBA.b},${0.15})` : "rgba(0,0,0,0.15)"
                    };
                } else if ($ctrl.pluginIcon?.type === "custom") {
                    $ctrl.iconContainerStyle = {
                        background: $ctrl.pluginIcon.backgroundColor ?? "rgba(0,0,0,0.15)"
                    };
                }
            }

            $ctrl.$onInit = $ctrl.$onChanges = function () {
                if (!$ctrl.pluginIcon || typeof $ctrl.pluginIcon !== "object") {
                    $ctrl.pluginIcon = {
                        type: "font-awesome",
                        name: DEFAULT_ICON_CLASS,
                        color: DEFAULT_COLOR
                    };
                }

                if ($ctrl.pluginIcon.type === "font-awesome" && (typeof $ctrl.pluginIcon.name !== "string" || !$ctrl.pluginIcon.name.startsWith("fa-") || $ctrl.pluginIcon.name.includes(" "))) {
                    $ctrl.pluginIcon.name = DEFAULT_ICON_CLASS;
                }

                updateIconContainerStyle();
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("pluginIcon", pluginIcon);
})();

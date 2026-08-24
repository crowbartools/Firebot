import type {
    EffectType,
    OverlayPosition,
    OverlayRotation,
    OverlayEnterExitAnimations,
    OverlayInstance,
    FontOptions
} from "../../../types";

import { HttpServerManager } from "../../../server/http-server-manager";
import { SettingsManager } from "../../common/settings-manager";
import mediaProcessor from "../../common/handlers/mediaProcessor";
import { LoggerCache } from "../../logger-cache";

const logger = LoggerCache.getLogger("Effects");

type ShowTextEffectModel = {
    text: string;
    fontOptions: FontOptions;
    addDropShadow: boolean;
    duration: number;
    height: number;
    width: number;
    wrapText: boolean;
    showDebugBorder: boolean;
    justify: "flex-start" | "center" | "flex-end";
    align: "flex-start" | "center" | "flex-end";
}
& OverlayPosition
& OverlayRotation
& OverlayEnterExitAnimations
& OverlayInstance;

type ShowTextEffectOverlayData = {
    text: string;
    fontOptions: FontOptions;
    addDropShadow: boolean;
    inbetweenAnimation: string;
    inbetweenDelay: number;
    inbetweenDuration: number;
    inbetweenRepeat: number;
    enterAnimation: string;
    enterDuration: number;
    exitAnimation: string;
    exitDuration: number;
    customCoords: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    position: string;
    duration: number;
    height: number;
    width: number;
    justify: "flex-start" | "center" | "flex-end";
    align: "flex-start" | "center" | "flex-end";
    wrapText: boolean;
    showDebugBorder: boolean;
    overlayInstance: string;
    rotation: string;
    zIndex: number;
};

const ShowTextEffect: EffectType<ShowTextEffectModel, ShowTextEffectOverlayData> = {
    definition: {
        id: "firebot:show-text",
        name: "Show Text",
        description: "Shows specified text in the overlay",
        icon: "fad fa-text",
        categories: ["common", "overlay"],
        dependencies: []
    },
    getDefaultLabel: (effect) => {
        return effect.text;
    },
    optionsTemplate: `
        <eos-container header="Text">
            <firebot-input
                model="effect.text"
                use-text-area="true"
            />
        </eos-container>

        <eos-container header="Style" pad-top="true">
            <font-options
                ng-model="effect.fontOptions"
                allow-alpha="true"
            />
            <firebot-checkbox
                model="effect.addDropShadow"
                label="Drop Shadow"
                style="margin-top: 10px;"
            />
        </eos-container>

        <eos-container header="Duration" pad-top="true">
            <firebot-input
                model="effect.duration"
                input-title="Seconds"
                data-type="number"
            />
        </eos-container>

        <eos-container header="Container Settings" pad-top="true">
            <p>This defines the size of the (invisible) box that the above text will be placed in.</p>
            <div class="form-group">
                <firebot-input
                    model="effect.width"
                    input-title="Width (in pixels)"
                    input-type="number"
                    disable-variables="true"
                />
                <firebot-input
                    model="effect.height"
                    input-title="Height (in pixels)"
                    input-type="number"
                    disable-variables="true"
                />
            </div>

            <firebot-checkbox
                model="effect.wrapText"
                label="Wrap Text"
                style="margin-top: 10px;"
            />

            <firebot-checkbox
                model="effect.showDebugBorder"
                label="Show Debug Border"
                tooltip="Show a red border around the text box to make it easier to see its position"
                style="margin-top: 10px;"
            />

            <p style="margin-top: 5px;">Justification</p>
            <firebot-radio-cards
                options="justifyOptions"
                ng-model="effect.justify"
                grid-columns="3"
            />

            <p style="margin-top: 5px;">Alignment</p>
            <firebot-radio-cards
                options="alignOptions"
                ng-model="effect.align"
                grid-columns="3"
            />
        </eos-container>

        <eos-overlay-position effect="effect" pad-top="true"></eos-overlay-position>

        <eos-overlay-rotation effect="effect" pad-top="true"></eos-overlay-rotation>

        <eos-enter-exit-animations effect="effect" pad-top="true"></eos-enter-exit-animations>

        <eos-overlay-instance effect="effect" pad-top="true"></eos-overlay-instance>

        <eos-container pad-top="true">
            <div class="effect-info alert alert-warning">
                This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, utilityService) => {
        $scope.justifyOptions = [
            { value: "flex-start", label: "Left", iconClass: "fa-align-left" },
            { value: "center", label: "Center", iconClass: "fa-align-center" },
            { value: "flex-end", label: "Right", iconClass: "fa-align-right" }
        ];

        $scope.alignOptions = [
            { value: "flex-start", label: "Top", iconClass: "fa-arrow-to-top" },
            { value: "center", label: "Center", iconClass: "fa-border-center-h" },
            { value: "flex-end", label: "Bottom", iconClass: "fa-arrow-to-bottom" }
        ];

        if ($scope.effect.fontOptions == null) {
            $scope.effect.fontOptions = {
                family: "Inter",
                size: 24,
                weight: 400,
                italic: false
            };
        }

        if ($scope.effect.height == null || $scope.effect.height < 1) {
            $scope.effect.height = 200;
        }

        if ($scope.effect.width == null || $scope.effect.width < 1) {
            $scope.effect.width = 400;
        }

        if ($scope.effect.justify == null) {
            $scope.effect.justify = "center";
        }

        if ($scope.effect.align == null) {
            $scope.effect.align = "center";
        }

        if ($scope.effect.wrapText == null) {
            $scope.effect.wrapText = true;
        }

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!effect.text?.length) {
            errors.push("Please enter some text to show.");
        }
        return errors;
    },
    onTriggerEvent: ({ effect }) => {
        const dto: ShowTextEffectOverlayData = {
            text: effect.text,
            fontOptions: effect.fontOptions,
            inbetweenAnimation: effect.inbetweenAnimation,
            inbetweenDelay: effect.inbetweenDelay,
            inbetweenDuration: effect.inbetweenDuration,
            inbetweenRepeat: effect.inbetweenRepeat,
            enterAnimation: effect.enterAnimation,
            enterDuration: effect.enterDuration,
            exitAnimation: effect.exitAnimation,
            exitDuration: effect.exitDuration,
            customCoords: effect.customCoords,
            position: !!effect.position?.length ? effect.position : "Middle",
            duration: effect.duration > 0 ? effect.duration : 5,
            height: effect.height == null || effect.height < 1 ? 200 : effect.height,
            width: effect.width == null || effect.width < 1 ? 400 : effect.width,
            justify: effect.justify ?? "center",
            align: effect.align ?? "center",
            wrapText: effect.wrapText,
            showDebugBorder: effect.showDebugBorder,
            addDropShadow: effect.addDropShadow,
            overlayInstance: effect.overlayInstance,
            rotation: effect.rotation ? effect.rotation + effect.rotType : "0deg",
            zIndex: effect.zIndex
        };

        const position = dto.position;
        if (position === "Random") {
            logger.debug("Getting random preset location");
            dto.position = mediaProcessor.randomLocation();
        }

        if (SettingsManager.getSetting("UseOverlayInstances")) {
            if (dto.overlayInstance != null) {
                //reset overlay if it doesnt exist
                if (!SettingsManager.getSetting("OverlayInstances").includes(dto.overlayInstance)) {
                    dto.overlayInstance = null;
                }
            }
        }

        HttpServerManager.sendToOverlay("show-text", dto);
        return true;
    },
    overlayExtension: {
        event: {
            name: "show-text",
            onOverlayEvent: (event) => {
                const data = event;

                const positionData = {
                    position: data.position,
                    customCoords: data.customCoords
                };

                const animationData = {
                    enterAnimation: data.enterAnimation,
                    enterDuration: data.enterDuration,
                    inbetweenAnimation: data.inbetweenAnimation,
                    inbetweenDelay: data.inbetweenDelay,
                    inbetweenDuration: data.inbetweenDuration,
                    inbetweenRepeat: data.inbetweenRepeat,
                    exitAnimation: data.exitAnimation,
                    exitDuration: data.exitDuration,
                    // @ts-ignore
                    totalDuration: parseFloat(data.duration) * 1000
                };

                // @ts-ignore
                const params = new URL(location).searchParams;

                let textAlign: string = data.justify;
                if (data.justify === "flex-start") {
                    textAlign = "left";
                } else if (data.justify === "flex-end") {
                    textAlign = "right";
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add("text-container");

                textContainer.style.height = `${data.height}px`;
                textContainer.style.width = `${data.width}px`;
                textContainer.style.justifyContent = data.justify;
                textContainer.style.alignItems = data.align;
                textContainer.style.textAlign = textAlign;

                if (data.rotation) {
                    textContainer.style.transform = `rotate(${data.rotation})`;
                }

                let borderColor = params.get("borderColor");
                if ((borderColor == null || borderColor.length > 1) && data.showDebugBorder) {
                    borderColor = "red";
                }

                if (borderColor) {
                    textContainer.style.border = `2px solid ${borderColor}`;
                }

                if (data.zIndex) {
                    textContainer.style.position = "relative";
                    textContainer.style.zIndex = `${data.zIndex}`;
                }

                const textElement = document.createElement("div");
                textElement.innerText = data.text;
                textElement.style.width = "100%";
                textElement.style.fontFamily = data.fontOptions.family;
                textElement.style.fontSize = `${data.fontOptions.size}px`;
                textElement.style.fontWeight = `${data.fontOptions.weight}`;
                textElement.style.color = data.fontOptions.color ?? "#FFFFFF";

                if (data.fontOptions.italic === true) {
                    textElement.style.fontStyle = "italic";
                }

                if (data.addDropShadow) {
                    textElement.style.textShadow = "2px 1px 3px rgb(2 2 2 / 33%)";
                }

                if (data.wrapText) {
                    textElement.style.whiteSpace = "normal";
                    textElement.style.wordWrap = "break-word";
                } else {
                    textElement.style.overflow = "hidden";
                    textElement.style.whiteSpace = "nowrap";
                }

                textContainer.appendChild(textElement);

                showElement(textContainer.outerHTML, positionData, animationData);
            }
        }
    }
};

export = ShowTextEffect;
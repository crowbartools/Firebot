"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");
const logger = require("../../logwrapper");
const util = require("../../utility");
const mediaProcessor = require("../../common/handlers/mediaProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The Show Text effect
 */
const showText = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:showtext",
        name: "Show Text",
        description: "Shows specified text in the overlay.",
        tags: ["Built in"],
        dependencies: [EffectDependency.OVERLAY],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
  <eos-container header="Text">
    <div>
        <summernote ng-model="effect.text" config="editorOptions"></summernote>
    </div>
    </eos-container>

    <eos-container header="Dimensions" class="setting-padtop">
    <p>This defines the size of the (invisible) box that the above text will be placed in.</p>
    <div class="input-group">
        <span class="input-group-addon">Width (in pixels)</span>
        <input 
            class="form-control" 
            type="number"
            min="1" max="10000"
            ng-model="effect.width">
        <span class="input-group-addon">Height (in pixels)</span>
        <input 
            class="form-control"
            type="number"
            min="1" max="10000"
            ng-model="effect.height">
    </div>
    </eos-container>

    <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>

    <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

    <eos-container header="Duration" class="setting-padtop">
    <div class="input-group">
        <span class="input-group-addon">Seconds</span>
        <input
            class="form-control"
            type="number"
            ng-model="effect.duration">
    </div>
    </eos-container>

    <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>

    <div class="effect-info alert alert-warning">
    This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, utilityService) => {
        if ($scope.effect.height == null || $scope.effect.height < 1) {
            $scope.effect.height = 200;
        }

        if ($scope.effect.width == null || $scope.effect.width < 1) {
            $scope.effect.width = 400;
        }

        $scope.editorOptions = {
            height: 300,
            disableDragAndDrop: true,
            toolbar: [
                ["style", ["bold", "italic", "underline", "clear"]],
                ["fontname", ["fontname"]],
                ["fontsize", ["fontsize"]],
                ["color", ["color"]],
                ["para", ["ul", "ol"]],
                ["misc", ["undo", "redo", "codeview"]]
            ],
            fontSizes: [
                "8",
                "9",
                "10",
                "11",
                "12",
                "14",
                "18",
                "24",
                "36",
                "48",
                "64",
                "82",
                "150",
                "200",
                "250",
                "300"
            ]
        };

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.text == null) {
            errors.push("Please enter some text to show.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {

            // What should this do when triggered.
            let effect = event.effect;

            //data transfer object
            let dto = {
                text: effect.text,
                inbetweenAnimation: effect.inbetweenAnimation,
                inbetweenDelay: effect.inbetweenDelay,
                inbetweenDuration: effect.inbetweenDuration,
                inbetweenRepeat: effect.inbetweenRepeat,
                enterAnimation: effect.enterAnimation,
                enterDuration: effect.enterDuration,
                exitAnimation: effect.exitAnimation,
                exitDuration: effect.exitDuration,
                customCoords: effect.customCoords,
                position: effect.position,
                duration: effect.duration,
                height: effect.height,
                width: effect.width,
                overlayInstance: effect.overlayInstance
            };

            let position = dto.position;
            if (position === "Random") {
                logger.debug("Getting random preset location");
                dto.position = getRandomPresetLocation(); //eslint-disable-line no-undef
            }

            if (settings.useOverlayInstances()) {
                if (dto.overlayInstance != null) {
                    //reset overlay if it doesnt exist
                    if (!settings.getOverlayInstances().includes(dto.overlayInstance)) {
                        dto.overlayInstance = null;
                    }
                }
            }

            // Ensure defaults
            if (dto.duration <= 0) {
                logger.debug("Effect duration is less than 0, resetting duration to 5 sec");
                dto.duration = 5;
            }

            if (dto.height == null || dto.height < 1) {
                logger.debug("Setting default height");
                dto.height = 200;
            }

            if (dto.width == null || dto.width < 1) {
                logger.debug("Setting default width");
                dto.width = 400;
            }

            if (dto.position === "" || dto.position == null) {
                logger.debug("Setting default overlay position");
                dto.position = "Middle";
            }

            webServer.sendToOverlay("text", dto);
            resolve(true);
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "text",
            onOverlayEvent: event => {



                let data = event;

                let positionData = {
                    position: data.position,
                    customCoords: data.customCoords
                };

                let animationData = {
                    enterAnimation: data.enterAnimation,
                    enterDuration: data.enterDuration,
                    inbetweenAnimation: data.inbetweenAnimation,
                    inbetweenDelay: data.inbetweenDelay,
                    inbetweenDuration: data.inbetweenDuration,
                    inbetweenRepeat: data.inbetweenRepeat,
                    exitAnimation: data.exitAnimation,
                    exitDuration: data.exitDuration,
                    totalDuration: parseFloat(data.duration) * 1000
                };

                let params = new URL(location).searchParams;
                let borderColor = params.get("borderColor");
                let borderStyle = borderColor ? `border: 2px solid ${borderColor};` : "";

                let textDiv = `
                    <div class="text-container"
                        style="height:${data.height}px;width:${data.width}px;${borderStyle}">
                        ${data.text}
                    </div>`;

                showElement(textDiv, positionData, animationData); // eslint-disable-line no-undef
            }
        }
    }
};

module.exports = showText;

"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const joystick = require("../../common/handlers/controlEmulation/joystick");
const logger = require("../../logwrapper");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;


/**
 * The Control Mouse
 */
const controlMouse = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:controlMouse",
        name: "Control Mouse",
        description: "Controls mouse movement.",
        tags: ["Fun", "Mouse", "Built in"],
        dependencies: [EffectDependency.INTERACTIVE],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.JOYSTICK, ControlKind.SCREEN],
            [InputEvent.MOUSEDOWN, InputEvent.MOUSEUP, InputEvent.MOVE],
            EffectTrigger.INTERACTIVE
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
        <eos-container>
            <div class="effect-info alert alert-info">
                No settings! Firebot will control the mouse when people are on this scene.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, listenerService) => {
    // The name of the api and if it has images available to show or not.


    },
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {

    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise((resolve, reject) => {
            let eventType = event.trigger.metadata.control.kind;
            let inputData = event.trigger.metadata.inputData;

            logger.info(event);
            if (eventType === "screen" && inputData.event === "move") {

                joystick.go(inputData);

            }


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
            name: "controlMouse",
            onOverlayEvent: event => {
                // The API Effect can sometimes show images in the overlay.
                // As part of this we use the showImage event.
            }
        }
    }
};

module.exports = controlMouse;

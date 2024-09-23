"use strict";

const { settings } = require("../../common/settings-access");
const webServer = require("../../../server/http-server-manager");
const logger = require("../../logwrapper");
const { EffectCategory } = require('../../../shared/effect-constants');
const mediaProcessor = require("../../common/handlers/mediaProcessor");

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
        icon: "fad fa-text",
        categories: [EffectCategory.COMMON, EffectCategory.OVERLAY],
        dependencies: []
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
        <div ng-class="editorClass" replace-variables on-variable-insert="onVariableInsert(text)" menu-position="bottom">
            <summernote on-editor-ready="editorReady(editor)" ng-model="effect.text" config="editorOptions" editor="editor" editable="editable"></summernote>
        </div>
        <div style="margin-top: 10px;">
            <div class="form-group">
                <label class="form-label">Editor Background</label>
                <div>
                    <div class="btn-group">
                        <label class="btn btn-default btn-lg" ng-model="editorSettings.editorBackground" ng-change="editorBackgroundChanged()" uib-btn-radio="'white'">White</label>
                        <label class="btn btn-default btn-lg" ng-model="editorSettings.editorBackground" ng-change="editorBackgroundChanged()" uib-btn-radio="'black'">Black</label>
                    </div>
                </div>
            </div>
        </div>
    </eos-container>

    <eos-container header="Text Settings" pad-top="true">
        <label class="control-fb control--checkbox"> Drop shadow
            <input type="checkbox" ng-model="effect.dropShadow" />
            <div class="control__indicator"></div>
        </label>
    </eos-container>

    <eos-container header="Duration" class="setting-padtop">
        <div class="input-group">
            <span class="input-group-addon">Seconds</span>
            <input
                class="form-control"
                type="text"
                ng-model="effect.duration"
                replace-variables="number">
        </div>
    </eos-container>

    <eos-container header="Container Settings" class="setting-padtop">
        <p>This defines the size of the (invisible) box that the above text will be placed in.</p>
        <div class="input-group" style="margin-bottom: 10px;">
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

        <label class="control-fb control--checkbox"> Don't Wrap Text
            <input type="checkbox" ng-model="effect.dontWrap" />
            <div class="control__indicator"></div>
        </label>

        <label class="control-fb control--checkbox"> Show Debug Border <tooltip text="'Show a red border around the text box to make it easier to see its position.'"></tooltip>
            <input type="checkbox" ng-model="effect.debugBorder" />
            <div class="control__indicator"></div>
        </label>

        <p>Justification</p>
        <label class="control-fb control--radio">Left
            <input type="radio" ng-model="effect.justify" value="flex-start"/>
            <div class="control__indicator"></div>
        </label>
        <label class="control-fb control--radio" >Center
            <input type="radio" ng-model="effect.justify" value="center"/>
            <div class="control__indicator"></div>
        </label>
        <label class="control-fb control--radio" >Right
            <input type="radio" ng-model="effect.justify" value="flex-end"/>
            <div class="control__indicator"></div>
        </label>

        <p>Align</p>
        <label class="control-fb control--radio">Top
            <input type="radio" ng-model="effect.align" value="flex-start"/>
            <div class="control__indicator"></div>
        </label>
        <label class="control-fb control--radio" >Center
            <input type="radio" ng-model="effect.align" value="center"/>
            <div class="control__indicator"></div>
        </label>
        <label class="control-fb control--radio" >Bottom
            <input type="radio" ng-model="effect.align" value="flex-end"/>
            <div class="control__indicator"></div>
        </label>
    </eos-container>

    <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>

    <eos-overlay-rotation effect="effect" pad-top="true"></eos-overlay-rotation>

    <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>

    <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
    <div class="effect-info alert alert-warning">
        This effect requires the Firebot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal(effect.overlayInstance)" style="text-decoration:underline">Learn more</a>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, fontManager, utilityService, $timeout, settingsService) => {

        $scope.editorClass = "text-editor-white-bg";

        $scope.editorSettings = {
            editorBackground: settingsService.getWysiwygBackground()
        };

        function updateEditorClass() {
            if ($scope.editorSettings.editorBackground === "black") {
                $scope.editorClass = "text-editor-black-bg";
            } else {
                $scope.editorClass = "text-editor-white-bg";
            }
        }
        updateEditorClass();

        $scope.editorBackgroundChanged = function() {
            settingsService.setWysiwygBackground($scope.editorSettings.editorBackground);
            updateEditorClass();
        };

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

        if ($scope.effect.dontWrap == null) {
            $scope.effect.dontWrap = false;
        }

        $scope.editorReady = (editor) => {
            $scope.editor = editor;
        };

        $scope.onVariableInsert = (text) => {
            if ($scope.editor == null) {
                return;
            }
            $scope.editor.summernote('restoreRange');
            $scope.editor.summernote("focus");
            $timeout(() => {
                $scope.editor.summernote("insertText", text);
            }, 100);

        };

        $scope.editorOptions = {
            height: 300,
            disableDragAndDrop: true,
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol']],
                ['misc', ['undo', 'redo', 'codeview']]
            ],
            fontSizes: ['8', '9', '10', '11', '12', '14', '18', '24', '36', '48', '64', '82', '88', '96', '110', '124', '136', '150', '200', '250', '300'],
            fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Inter', 'Open Sans', 'Roboto'],
            fontNamesIgnoreCheck: ['Inter', 'Open Sans', 'Roboto']
        };

        const installedFontNames = fontManager.getInstalledFonts().map(f => f.name);
        $scope.editorOptions.fontNames = $scope.editorOptions.fontNames.concat(installedFontNames);
        $scope.editorOptions.fontNamesIgnoreCheck = $scope.editorOptions.fontNamesIgnoreCheck.concat(installedFontNames);

        $scope.showOverlayInfoModal = function(overlayInstance) {
            utilityService.showOverlayInfoModal(overlayInstance);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.text == null) {
            errors.push("Please enter some text to show.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async (event) => {

        // What should this do when triggered.
        const effect = event.effect;

        //data transfer object
        const dto = {
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
            justify: effect.justify,
            align: effect.align,
            dontWrap: effect.dontWrap,
            debugBorder: effect.debugBorder,
            dropShadow: effect.dropShadow,
            overlayInstance: effect.overlayInstance,
            rotation: effect.rotation ? effect.rotation + effect.rotType : "0deg"
        };

        const position = dto.position;
        if (position === "Random") {
            logger.debug("Getting random preset location");
            dto.position = mediaProcessor.randomLocation(); //eslint-disable-line no-undef
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

        if (dto.justify == null) {
            dto.justify = "center";
        }

        if (dto.align == null) {
            dto.align = "center";
        }

        webServer.sendToOverlay("text", dto);
        return true;
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
                    totalDuration: parseFloat(data.duration) * 1000
                };

                const params = new URL(location).searchParams;

                let textAlign = data.justify;
                if (data.justify === "flex-start") {
                    textAlign = "left";
                } else if (data.justify === "flex-end") {
                    textAlign = "right";
                }

                let styles = `height:${data.height}px;width:${data.width}px;`;

                styles += `justify-content:${data.justify};text-align:${textAlign};align-items:${data.align};`;

                if (data.rotation) {
                    styles += `transform: rotate(${data.rotation});`;
                }

                let innerStyles = "width: 100%;";
                if (data.dontWrap) {
                    innerStyles += "overflow: hidden; white-space: nowrap;";
                } else {
                    innerStyles += "white-space:normal;word-wrap: break-word;";
                }

                if (data.dropShadow) {
                    innerStyles += "text-shadow: 2px 1px 3px rgb(2 2 2 / 33%);";
                }

                let borderColor = params.get("borderColor");
                if ((borderColor == null || borderColor.length > 1) && data.debugBorder) {
                    borderColor = "red";
                }

                if (borderColor) {
                    styles += `border: 2px solid ${borderColor};`;
                }

                const textDiv = `
                    <div class="text-container"
                        style="${styles}">
                        <div style="${innerStyles}">${data.text}</div>
                    </div>`;

                showElement(textDiv, positionData, animationData); // eslint-disable-line no-undef
            }
        }
    }
};

module.exports = showText;

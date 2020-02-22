"use strict";

const logger = require("../../logwrapper");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const customScriptProcessor = require("../../common/handlers/custom-scripts/customScriptProcessor");

/**
 * The custom var effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:customscript",
        name: "Run Custom Script",
        description: "Run a custom JS script.",
        tags: ["Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX, ControlKind.JOYSTICK],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT, InputEvent.MOVE],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <eos-container>
            <div class="effect-info alert alert-info">
                Place scripts in the <a id="scriptFolderBtn" ng-click="openScriptsFolder()" style="text-decoration:underline;color:#53afff;cursor:pointer;">scripts folder</a> of the Firebot user-settings directory, then refresh the dropdown.
            </div>
        </eos-container>

        <eos-container header="Script">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="script-type">{{effect.scriptName ? effect.scriptName : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <a ng-click="getNewScripts()" id="refreshScriptList" style="padding-left:5px;height:100%;cursor:pointer;"><i class="far fa-sync" id="refreshIcon" style="margin-top:10px;" aria-hidden="true"></i></a>
                <ul class="dropdown-menu script-dropdown">
                    <li ng-show="scriptArray.length == 0" class="muted">
                        <a href>No scripts found.</a>
                    </li>
                    <li ng-repeat="script in scriptArray" ng-click="selectScript(script)">
                        <a href>{{script}}</a>
                    </li>
                </ul>
            </div>
        </eos-container>

        <eos-container ng-show="effect.scriptName != null" pad-top="true">
            <div ng-if="scriptManifest != null" style="padding-bottom:10px;"> 
                <div class="script-name">{{scriptManifest.name ? scriptManifest.name : "Unnamed Script"}} <span class="script-version muted">{{scriptManifest.version ? scriptManifest.version : "Unknown"}}</span></div>
                <div style="font-size: 13px;">by <span class="script-author">{{scriptManifest.author ? scriptManifest.author : "Unknown"}}</span><span ng-if="scriptManifest.website" class="script-website"> (<a ng-click="openScriptsWebsite()" class="clickable">{{scriptManifest.website}}</a>)</span><span></span></div>     
                <div class="script-description">{{scriptManifest.description}}</div>
            </div>
        </eos-container>

        <eos-container header="Script Options" ng-show="effect.scriptName != null">
            <div ng-show="isLoadingParameters">
                Loading options...
            </div>
            <div ng-hide="isLoadingParameters">
                <span ng-hide="scriptHasParameters()" class="muted">Script has no options.</span>
                <div ng-show="scriptHasParameters()">
                    <script-parameter-option ng-repeat="(parameterName, parameterMetadata) in effect.parameters" 
                    name="parameterName" 
                    metadata="parameterMetadata" 
                    trigger="{{trigger}}"
                    trigger-meta="triggerMeta" 
                    modalId="{{modalId}}"></script-parameter-option>
                </div>
            </div>
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-danger">
                <strong>Warning:</strong> Only use scripts from sources you absolutely trust!
            </div>
        </eos-container>
    `,
    optionsController: ($rootScope, $scope, $q, logger, utilityService, backendCommunicator, profileManager) => {

        const fs = require("fs");
        const path = require("path");

        function loadParameters(scriptName, initialLoad = true) {
            logger.info("Attempting to load custom script parameters...");
            $scope.isLoadingParameters = true;

            let scriptsFolder = profileManager.getPathInProfile("/scripts");
            let scriptFilePath = path.resolve(scriptsFolder, scriptName);
            // Attempt to load the script
            try {
                // Make sure we first remove the cached version, incase there was any changes
                delete require.cache[require.resolve(scriptFilePath)];

                let customScript = require(scriptFilePath);

                //grab the manifest
                if (typeof customScript.getScriptManifest === "function") {
                    $scope.scriptManifest = customScript.getScriptManifest();

                } else {
                    $scope.scriptManifest = null;
                }

                if (!initialLoad && ($scope.scriptManifest == null || $scope.scriptManifest.firebotVersion !== "5")) {
                    utilityService.showInfoModal("The selected script may not have been written for Firebot V5 and so might not function as expected. Please reach out to us on Discord or Twitter if you need assistance.");
                }

                let currentParameters = $scope.effect.parameters;
                if (typeof customScript.getDefaultParameters === "function") {
                    let parameterRequest = {
                        modules: {
                            request: require("request")
                        }
                    };
                    let parametersPromise = customScript.getDefaultParameters(
                        parameterRequest
                    );

                    $q.when(parametersPromise).then(parameters => {
                        let defaultParameters = parameters;

                        if (currentParameters != null) {
                            //get rid of old params that no longer exist
                            Object.keys(currentParameters).forEach(
                                currentParameterName => {
                                    let currentParamInDefaults = defaultParameters[currentParameterName];
                                    if (currentParamInDefaults == null) {
                                        delete currentParameters[currentParameterName];
                                    }
                                }
                            );

                            //handle any new params
                            Object.keys(defaultParameters).forEach(
                                defaultParameterName => {
                                    let currentParam = currentParameters[defaultParameterName];
                                    let defaultParam = defaultParameters[defaultParameterName];
                                    if (currentParam != null) {
                                        //Current param exsits lets update the value.
                                        defaultParam.value = currentParam.value;
                                    }
                                    currentParameters[defaultParameterName] = defaultParam;
                                }
                            );
                        } else {
                            $scope.effect.parameters = defaultParameters;
                        }
                        $scope.isLoadingParameters = false;
                    });
                } else {
                    $scope.isLoadingParameters = false;
                }
            } catch (err) {
                utilityService.showErrorModal("Error loading the script '" + scriptName + "'\n\n" + err);
                logger.error(err);
            }
        }

        $scope.isLoadingParameters = true;

        let scriptFolderPath = profileManager.getPathInProfile("/scripts");
        // Grab files in folder when button effect shown.
        $scope.scriptArray = fs.readdirSync(scriptFolderPath);

        // Grab files in folder on refresh click.
        $scope.getNewScripts = function() {
            $scope.scriptArray = fs.readdirSync(scriptFolderPath);
            if ($scope.effect.scriptName != null) {
                loadParameters($scope.effect.scriptName);
            }
        };

        // Open script folder on click.
        $scope.openScriptsFolder = function() {
            backendCommunicator.fireEvent("openScriptsFolder");
        };

        $scope.openScriptsWebsite = function() {
            if (!$scope.scriptManifest || !$scope.scriptManifest.website)
                return;
            $rootScope.openLinkExternally($scope.scriptManifest.website);
        };

        $scope.selectScript = function(scriptName) {
            $scope.effect.scriptName = scriptName;
            $scope.effect.parameters = null;
            $scope.scriptManifest = null;
            loadParameters(scriptName, false);
        };

        $scope.scriptHasParameters = function() {
            return ($scope.effect.parameters != null &&
                Object.keys($scope.effect.parameters).length > 0);
        };

        if ($scope.effect.scriptName != null) {
            loadParameters($scope.effect.scriptName);
        }
    },
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {

            logger.debug("Processing script...");

            customScriptProcessor
                .processScript(event.effect, event.trigger)
                .then(() => {
                    resolve(true);
                })
                .catch(err => {
                    renderWindow.webContents.send('error', "Oops! There was an error processing the custom script. Error: " + err);
                    logger.error(err);
                    resolve(false);
                });

        });
    }
};

module.exports = fileWriter;

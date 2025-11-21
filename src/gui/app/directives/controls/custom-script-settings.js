"use strict";

(function() {
    const fs = require("fs");
    const path = require("path");
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module('firebotApp')
        .component("customScriptSettings", {
            bindings: {
                effect: "=",
                modalId: "<",
                trigger: "<",
                triggerMeta: "<",
                allowStartup: "<",
                isNewStartup: "<?",
                initFirst: "=?"
            },
            template: `
            <eos-container header="Script">

                <div class="effect-info alert alert-info">
                    Place scripts in the <a id="scriptFolderBtn" ng-click="openScriptsFolder()" style="text-decoration:underline;color:#53afff;cursor:pointer;">scripts folder</a> of the Firebot user-settings directory, then refresh the dropdown.
                </div>

                <div class="flex items-center">
                    <firebot-searchable-select
                        items="scriptArray"
                        ng-model="effect.scriptName"
                        placeholder="Select script"
                        on-select="selectScript(item)"
                        style="flex-grow: 1;"
                        class="mr-2"
                    />
                    <a ng-click="getNewScripts()" id="refreshScriptList" style="padding-left:5px;height:100%;cursor:pointer;"><i class="far fa-sync" id="refreshIcon" style="margin-top:10px;" aria-hidden="true"></i></a>
                </div>
            </eos-container>

            <eos-container ng-show="effect.scriptName != null" pad-top="true">
                <div ng-if="scriptManifest != null" style="padding-bottom:10px;">
                    <div class="script-name">{{scriptManifest.name ? scriptManifest.name : "Unnamed Script"}} <span class="script-version muted">{{scriptManifest.version ? scriptManifest.version : "Unknown"}}</span></div>
                    <div style="font-size: 13px;">by <span class="script-author">{{scriptManifest.author ? scriptManifest.author : "Unknown"}}</span><span ng-if="scriptManifest.website" class="script-website"> (<a ng-click="openScriptsWebsite()" class="clickable">{{scriptManifest.website}}</a>)</span><span></span></div>
                    <div
                        class="script-description markdown-container"
                        ng-bind-html="scriptManifest.description"
                    ></div>
                </div>
            </eos-container>

            <eos-container ng-show="$ctrl.initFirst">
                <i>After adding this script, you can configure its settings.</i>
            </eos-container>

            <eos-container header="Settings" ng-show="effect.scriptName != null && !$ctrl.initFirst">
                <div ng-show="isLoadingParameters">
                    Loading settings...
                </div>
                <div ng-hide="isLoadingParameters">
                    <span ng-hide="scriptHasParameters()" class="muted">Script has no settings.</span>
                    <div ng-show="scriptHasParameters()">
                        <dynamic-parameter
                            ng-repeat="(settingName, settingSchema) in effect.parameters"
                            name="{{settingName}}"
                            schema="settingSchema"
                            ng-model="effect.parameters[settingName].value"
                            trigger="{{trigger}}"
                            trigger-meta="triggerMeta"
                            modalId="{{modalId}}"
                        ></dynamic-parameter>
                    </div>
                </div>
            </eos-container>

            <eos-container>
                <div class="effect-info alert alert-danger">
                    <strong>Warning:</strong> Only use scripts from sources you absolutely trust!
                </div>
            </eos-container>
            `,
            controller: function($scope, utilityService, $rootScope, $q, logger,
                $sce, backendCommunicator, profileManager) {

                const $ctrl = this;

                function loadParameters(scriptName, initialLoad = true) {
                    logger.info("Attempting to load custom script parameters...");
                    $scope.isLoadingParameters = true;

                    const scriptsFolder = profileManager.getPathInProfile("/scripts");
                    const scriptFilePath = path.resolve(scriptsFolder, scriptName);
                    // Attempt to load the script
                    try {
                        // Make sure we first remove the cached version, incase there was any changes
                        delete require.cache[require.resolve(scriptFilePath)];

                        const customScript = require(scriptFilePath);

                        //grab the manifest
                        if (typeof customScript.getScriptManifest === "function") {
                            $scope.scriptManifest = customScript.getScriptManifest();
                            if ($scope.scriptManifest && $scope.scriptManifest.description) {
                                $scope.scriptManifest.description = $sce.trustAsHtml(
                                    sanitize(marked($scope.scriptManifest.description))
                                );
                            }
                        } else {
                            $scope.scriptManifest = null;
                        }

                        if ($scope.scriptManifest != null && $scope.scriptManifest.startupOnly && !$ctrl.allowStartup) {
                            utilityService.showInfoModal(`Unable to load '${$scope.effect.scriptName}' as this script can only be used as a Startup Script (Settings > Scripts > Startup Scripts)`);
                            $scope.effect.scriptName = undefined;
                            $scope.effect.parameters = undefined;
                            $scope.scriptManifest = undefined;
                            return;
                        }

                        if ($scope.scriptManifest &&
                            $scope.scriptManifest.startupOnly &&
                            $scope.scriptManifest.initBeforeShowingParams === true &&
                            $ctrl.allowStartup &&
                            $ctrl.isNewStartup) {
                            $ctrl.initFirst = true;
                        } else {
                            $ctrl.initFirst = false;
                        }

                        if ($scope.scriptManifest && $scope.scriptManifest.name && $ctrl.trigger === 'startup_script') {
                            $scope.effect.name = $scope.scriptManifest.name;
                        }


                        if (!initialLoad && ($scope.scriptManifest == null || $scope.scriptManifest.firebotVersion !== "5")) {
                            utilityService.showInfoModal("The selected script may not have been written for Firebot V5 and so might not function as expected. Please reach out to us on Discord or Bluesky if you need assistance.");
                        }

                        const currentParameters = $scope.effect.parameters;
                        if (typeof customScript.getDefaultParameters === "function") {
                            const parameterRequest = {
                                modules: {
                                    request: require("request")
                                }
                            };
                            const parametersPromise = customScript.getDefaultParameters(
                                parameterRequest
                            );

                            $q.when(parametersPromise).then((parameters) => {
                                const defaultParameters = parameters;

                                if (currentParameters != null) {
                                    //get rid of old params that no longer exist
                                    Object.keys(currentParameters).forEach(
                                        (currentParameterName) => {
                                            const currentParamInDefaults = defaultParameters[currentParameterName];
                                            if (currentParamInDefaults == null) {
                                                delete currentParameters[currentParameterName];
                                            }
                                        }
                                    );

                                    //handle any new params
                                    Object.keys(defaultParameters).forEach(
                                        (defaultParameterName) => {
                                            const currentParam = currentParameters[defaultParameterName];
                                            const defaultParam = defaultParameters[defaultParameterName];
                                            if (currentParam != null) {
                                                //Current param exists lets update the value.
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
                        utilityService.showErrorModal(`Error loading the script '${scriptName}'\n\n${err}`);
                        logger.error(err);
                    }
                }

                $scope.isLoadingParameters = true;

                const scriptFolderPath = profileManager.getPathInProfile("/scripts");

                const recursiveReaddirSync = (dir, prefix = '', visited = new Set()) => {
                    const result = [];
                    let realDir;
                    try {
                        realDir = fs.realpathSync(dir);
                    } catch {
                        // If realpath fails, skip this directory
                        return result;
                    }
                    if (visited.has(realDir)) {
                        // Already visited this directory (circular symlink), skip
                        return result;
                    }
                    visited.add(realDir);

                    let scriptFileNames;
                    try {
                        scriptFileNames = fs.readdirSync(dir);
                    } catch {
                        // If readdir fails, skip this directory
                        return result;
                    }

                    for (const entry of scriptFileNames) {
                        const fullPath = path.join(dir, entry);

                        let stat;
                        try {
                            stat = fs.statSync(fullPath);
                        } catch {
                            // If stat fails for whatever reason, skip this entry
                            continue;
                        }

                        if (stat.isDirectory()) {
                            if (entry === "node_modules" || entry === ".git") {
                                continue; // Skip node_modules and .git directories
                            }
                            result.push(...recursiveReaddirSync(fullPath, path.join(prefix, entry), visited));
                        } else if (entry.endsWith(".js")) {
                            result.push(path.join(prefix, entry));
                        }
                    }
                    return result;
                };

                const loadScriptFileNames = () => {
                    $scope.scriptArray = recursiveReaddirSync(scriptFolderPath)
                        .map(f => ({ id: f, name: f }));
                };
                loadScriptFileNames();

                // Grab files in folder on refresh click.
                $scope.getNewScripts = function() {
                    loadScriptFileNames();
                    if ($scope.effect.scriptName != null) {
                        loadParameters($scope.effect.scriptName);
                    }
                };

                // Open script folder on click.
                $scope.openScriptsFolder = function() {
                    backendCommunicator.fireEvent("openScriptsFolder");
                };

                $scope.openScriptsWebsite = function() {
                    if (!$scope.scriptManifest || !$scope.scriptManifest.website) {
                        return;
                    }

                    $rootScope.openLinkExternally($scope.scriptManifest.website);
                };

                $scope.selectScript = function(scriptItem) {
                    const scriptName = scriptItem.name;
                    $scope.effect.scriptName = scriptName;
                    $scope.effect.parameters = null;
                    $scope.scriptManifest = null;
                    loadParameters(scriptName, false);
                };

                $scope.scriptHasParameters = function() {
                    return ($scope.effect.parameters != null &&
                        Object.keys($scope.effect.parameters).length > 0);
                };

                $ctrl.$onInit = () => {

                    $scope.effect = $ctrl.effect;
                    $scope.modalId = $ctrl.modalId;
                    $scope.trigger = $ctrl.trigger;
                    $scope.triggerMeta = $ctrl.triggerMeta;

                    if ($scope.effect.scriptName != null) {
                        loadParameters($scope.effect.scriptName);
                    }
                };
            }
        });
}());

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
                scriptType: "@",
                isNewPlugin: "<?",
                initFirst: "=?"
            },
            template: `
            <eos-container header="Script">

                <div class="muted" style="font-size: 12px; margin-bottom: 10px;">
                    Looking for plugins that load at startup? See <b>Settings &rarr; Plugins &amp; Scripts</b>.
                </div>

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
                        ng-bind-html="scriptManifestDescriptionHtml"
                    ></div>
                </div>
            </eos-container>

            <eos-container header="Settings" ng-show="effect.scriptName != null">
                <div ng-show="isLoadingParameters">
                    Loading settings...
                </div>
                <div ng-hide="isLoadingParameters">
                    <span ng-hide="hasParameters()" class="muted">Script has no settings.</span>
                    <div ng-show="hasParameters()">
                        <dynamic-parameter
                            ng-repeat="param in parametersSchema"
                            name="{{param.name}}"
                            schema="param"
                            ng-model="effect.parameters[param.name]"
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
                $sce, backendCommunicator, pluginsService, profileManager) {

                const $ctrl = this;

                $scope.parametersSchema = [];
                $scope.scriptManifest = null;
                $scope.scriptManifestDescriptionHtml = null;
                $scope.isLoadingParameters = false;

                /**
                 * Existing saved effect data may have parameters in legacy nested
                 * shape: { [name]: { value, type, ... } }. Normalize to flat.
                 */
                function normalizeLegacyParams(rawParams) {
                    if (rawParams == null || typeof rawParams !== "object") {
                        return {};
                    }
                    const flat = {};
                    for (const [k, v] of Object.entries(rawParams)) {
                        if (v != null && typeof v === "object" && Object.prototype.hasOwnProperty.call(v, "value")) {
                            flat[k] = v.value;
                        } else {
                            flat[k] = v;
                        }
                    }
                    return flat;
                }

                function loadParameters(scriptName) {
                    $scope.isLoadingParameters = true;

                    $q.when(pluginsService.getScriptDetails(scriptName, $scope.scriptType)).then((result) => {
                        $scope.isLoadingParameters = false;

                        if (!result || result.success === false) {
                            const msg = (result && result.error) || `Could not load script "${scriptName}".`;
                            utilityService.showErrorModal(msg);
                            $scope.scriptManifest = null;
                            $scope.parametersSchema = [];
                            return;
                        }

                        const details = result.details || {};
                        const manifest = details.manifest || {};
                        $scope.scriptManifest = manifest;
                        $scope.scriptManifestDescriptionHtml = manifest.description
                            ? $sce.trustAsHtml(sanitize(marked(manifest.description)))
                            : null;

                        $scope.parametersSchema = Array.isArray(details.parametersSchema)
                            ? details.parametersSchema
                            : [];

                        // Normalize / seed effect.parameters
                        const existing = normalizeLegacyParams($scope.effect.parameters);

                        const next = {};
                        for (const p of $scope.parametersSchema) {
                            if (!p || !p.name) {
                                continue;
                            }
                            if (Object.prototype.hasOwnProperty.call(existing, p.name)) {
                                next[p.name] = existing[p.name];
                            } else if (p.default !== undefined) {
                                next[p.name] = p.default;
                            }
                        }
                        $scope.effect.parameters = next;
                    }).catch((err) => {
                        $scope.isLoadingParameters = false;
                        logger.error(err);
                        utilityService.showErrorModal(`Error loading script '${scriptName}'\n\n${err && err.message ? err.message : err}`);
                    });
                }

                const scriptFolderPath = profileManager.getPathInProfile("/scripts");

                const recursiveReaddirSync = (dir, prefix = '', visited = new Set()) => {
                    const result = [];
                    let realDir;
                    try {
                        realDir = fs.realpathSync(dir);
                    } catch {
                        return result;
                    }
                    if (visited.has(realDir)) {
                        return result;
                    }
                    visited.add(realDir);

                    let scriptFileNames;
                    try {
                        scriptFileNames = fs.readdirSync(dir);
                    } catch {
                        return result;
                    }

                    for (const entry of scriptFileNames) {
                        const fullPath = path.join(dir, entry);
                        let stat;
                        try {
                            stat = fs.statSync(fullPath);
                        } catch {
                            continue;
                        }
                        if (stat.isDirectory()) {
                            if (entry === "node_modules" || entry === ".git") {
                                continue;
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

                $scope.getNewScripts = function() {
                    loadScriptFileNames();
                    if ($scope.effect.scriptName != null) {
                        loadParameters($scope.effect.scriptName);
                    }
                };

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
                    $scope.effect.parameters = {};
                    $scope.scriptManifest = null;
                    loadParameters(scriptName);
                };

                $scope.hasParameters = function() {
                    return Array.isArray($scope.parametersSchema) && $scope.parametersSchema.length > 0;
                };

                $ctrl.$onInit = () => {
                    $scope.effect = $ctrl.effect;
                    $scope.modalId = $ctrl.modalId;
                    $scope.trigger = $ctrl.trigger;
                    $scope.triggerMeta = $ctrl.triggerMeta;

                    if ($scope.effect && $scope.effect.scriptName != null) {
                        loadParameters($scope.effect.scriptName);
                    }
                };
            }
        });
}());

"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("configurePluginModal", {
            template: `
            <div class="modal-header sticky-header">
                <button type="button" class="close" ng-hide="$ctrl.isInitializing" ng-click="$ctrl.cancel()"><span>&times;</span></button>
                <h4 class="modal-title">
                    <div style="font-size: 22px;">{{$ctrl.isNewInstall ? "Configure New Plugin" : "Configure Plugin"}}:</div>
                    <div style="font-weight:bold;font-size: 24px;">{{$ctrl.plugin.details.manifest.name || $ctrl.plugin.config.fileName}}</div>
                </h4>
            </div>
            <div class="modal-body px-0">
                <div ng-if="$ctrl.plugin.details.manifest" class="px-6 mb-6">
                    <div style="font-size: 13px;" ng-if="$ctrl.plugin.details.manifest.version">
                        v{{$ctrl.plugin.details.manifest.version}}<span ng-if="$ctrl.plugin.details.manifest.author"> &middot; by {{$ctrl.plugin.details.manifest.author}}</span>
                    </div>
                    <div ng-if="$ctrl.plugin.details.manifest.description" class="muted" style="margin-top: 4px;">
                        {{$ctrl.plugin.details.manifest.description}}
                    </div>
                    <div
                        ng-if="$ctrl.hasLinks()"
                        style="display:flex; align-items:center; flex-wrap: wrap; gap: 8px; margin-top: 8px;"
                    >
                        <a
                            ng-if="$ctrl.plugin.details.manifest.repo"
                            class="clickable plugin-link-pill"
                            ng-click="$ctrl.openLink($ctrl.plugin.details.manifest.repo)"
                            uib-tooltip="{{$ctrl.plugin.details.manifest.repo}}"
                            tooltip-append-to-body="true"
                        >
                            <i class="fab fa-github"></i> Source
                        </a>
                        <a
                            ng-if="$ctrl.plugin.details.manifest.website"
                            class="clickable plugin-link-pill"
                            ng-click="$ctrl.openLink($ctrl.plugin.details.manifest.website)"
                            uib-tooltip="{{$ctrl.plugin.details.manifest.website}}"
                            tooltip-append-to-body="true"
                        >
                            <i class="fas fa-globe"></i> Website
                        </a>
                        <a
                            ng-if="$ctrl.plugin.details.manifest.support"
                            class="clickable plugin-link-pill"
                            ng-click="$ctrl.openLink($ctrl.plugin.details.manifest.support)"
                            uib-tooltip="{{$ctrl.plugin.details.manifest.support}}"
                            tooltip-append-to-body="true"
                        >
                            <i class="fas fa-life-ring"></i> Support
                        </a>
                    </div>
                </div>

                <eos-container header="Settings">
                    <div ng-if="$ctrl.isInitializing" class="muted">
                        <i class="fas fa-spinner fa-pulse"></i> Initializing plugin...
                    </div>
                    <div ng-if="!$ctrl.isInitializing && $ctrl.initFirst" class="muted">
                        After installing this plugin, you'll be able to configure its settings.
                    </div>
                    <div ng-if="!$ctrl.isInitializing && !$ctrl.initFirst">
                        <div ng-if="!$ctrl.hasParameters()" class="muted">This plugin has no settings.</div>
                        <div ng-if="$ctrl.hasParameters()">
                            <dynamic-parameter
                                ng-repeat="param in $ctrl.parameters"
                                name="{{param.name}}"
                                schema="param"
                                ng-model="$ctrl.plugin.config.parameters[param.name]"
                            ></dynamic-parameter>
                        </div>
                    </div>
                </eos-container>
            </div>
            <div class="modal-footer sticky-footer">
                <button type="button" class="btn btn-link" ng-hide="$ctrl.isInitializing" ng-click="$ctrl.cancel()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-disabled="$ctrl.isInitializing" ng-click="$ctrl.save()">{{$ctrl.primaryButtonLabel()}}</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, pluginsService) {
                const $ctrl = this;

                $ctrl.plugin = null;
                $ctrl.isNewInstall = false;
                $ctrl.parameters = [];
                $ctrl.initFirst = false;
                $ctrl.isInitializing = false;

                function seedParameters() {
                    const schema = $ctrl.plugin.details && $ctrl.plugin.details.parametersSchema;
                    $ctrl.parameters = Array.isArray(schema) ? schema : [];

                    // Seed any unset values from schema defaults
                    for (const p of $ctrl.parameters) {
                        if (!p || !p.name) {
                            continue;
                        }
                        if ($ctrl.plugin.config.parameters[p.name] === undefined && p.default !== undefined) {
                            $ctrl.plugin.config.parameters[p.name] = p.default;
                        }
                    }
                }

                $ctrl.$onInit = function() {
                    $ctrl.plugin = $ctrl.resolve.plugin;
                    $ctrl.isNewInstall = $ctrl.resolve.isNewInstall === true;

                    if (!$ctrl.plugin.config.parameters) {
                        $ctrl.plugin.config.parameters = {};
                    }

                    const manifest = ($ctrl.plugin.details && $ctrl.plugin.details.manifest) || {};

                    $ctrl.initFirst = $ctrl.isNewInstall && manifest.initBeforeShowingParams === true;

                    seedParameters();
                };

                $ctrl.hasParameters = function() {
                    return Array.isArray($ctrl.parameters) && $ctrl.parameters.length > 0;
                };

                $ctrl.primaryButtonLabel = function() {
                    if (!$ctrl.isNewInstall) {
                        return "Save";
                    }
                    return $ctrl.initFirst ? "Install & Configure" : "Install";
                };

                $ctrl.hasLinks = function() {
                    const manifest = ($ctrl.plugin && $ctrl.plugin.details && $ctrl.plugin.details.manifest) || {};
                    return !!(manifest.repo || manifest.website || manifest.support);
                };

                $ctrl.openLink = function(url) {
                    if (url) {
                        $rootScope.openLinkExternally(url);
                    }
                };

                $ctrl.save = function() {
                    if ($ctrl.isInitializing) {
                        return;
                    }

                    // install & load the plugin, then show its params to the user
                    if ($ctrl.initFirst) {
                        $ctrl.isInitializing = true;
                        pluginsService.savePluginConfig($ctrl.plugin.config, true)
                            .then(() => {
                                const updated = pluginsService.getPluginById($ctrl.plugin.config.id);
                                if (updated && updated.details) {
                                    $ctrl.plugin.details = updated.details;
                                }
                                $ctrl.isNewInstall = false;
                                $ctrl.initFirst = false;
                                $ctrl.isInitializing = false;
                                seedParameters();
                            })
                            .catch(() => {
                                $ctrl.isInitializing = false;
                            });
                        return;
                    }

                    pluginsService.savePluginConfig($ctrl.plugin.config, $ctrl.isNewInstall).then(() => {
                        $ctrl.close({ $value: { saved: true } });
                    });
                };

                $ctrl.cancel = function() {
                    $ctrl.dismiss();
                };
            }
        });
}());

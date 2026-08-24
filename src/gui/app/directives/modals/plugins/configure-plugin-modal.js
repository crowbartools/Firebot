"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("configurePluginModal", {
            template: `
            <div class="modal-header sticky-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">
                    <div style="font-size: 22px;">Configure Plugin</div>
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
                    <div>
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
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
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
                $ctrl.parameters = [];

                $ctrl.$onInit = function() {
                    $ctrl.plugin = $ctrl.resolve.plugin;

                    if (!$ctrl.plugin.config.parameters) {
                        $ctrl.plugin.config.parameters = {};
                    }

                    const schema = $ctrl.plugin.details && $ctrl.plugin.details.parametersSchema;
                    $ctrl.parameters = Array.isArray(schema) ? schema : [];
                };

                $ctrl.hasParameters = function() {
                    return Array.isArray($ctrl.parameters) && $ctrl.parameters.length > 0;
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
                    pluginsService.savePluginConfig($ctrl.plugin.config).then(() => {
                        $ctrl.close({ $value: { saved: true } });
                    });
                };
            }
        });
}());
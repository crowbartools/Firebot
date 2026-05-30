"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("configurePluginModal", {
            template: `
            <div class="modal-header sticky-header">
                <button type="button" class="close" ng-click="$ctrl.cancel()"><span>&times;</span></button>
                <h4 class="modal-title">
                    <div style="font-size: 22px;">{{$ctrl.isNewInstall ? "Configure New Plugin" : "Configure Plugin"}}:</div>
                    <div style="font-weight:bold;font-size: 24px;">{{$ctrl.plugin.details.manifest.name || $ctrl.plugin.config.fileName}}</div>
                </h4>
            </div>
            <div class="modal-body">
                <div ng-if="$ctrl.plugin.details.manifest" style="margin-bottom: 15px;">
                    <div style="font-size: 13px;" ng-if="$ctrl.plugin.details.manifest.version">
                        v{{$ctrl.plugin.details.manifest.version}}<span ng-if="$ctrl.plugin.details.manifest.author"> &middot; by {{$ctrl.plugin.details.manifest.author}}</span>
                    </div>
                    <div ng-if="$ctrl.plugin.details.manifest.description" class="muted" style="margin-top: 4px;">
                        {{$ctrl.plugin.details.manifest.description}}
                    </div>
                    <div ng-if="$ctrl.plugin.details.manifest.website" style="margin-top: 4px;">
                        <a class="clickable" ng-click="$ctrl.openWebsite()">{{$ctrl.plugin.details.manifest.website}}</a>
                    </div>
                </div>

                <eos-container header="Settings">
                    <div ng-if="!$ctrl.hasParameters()" class="muted">This plugin has no settings.</div>
                    <div ng-if="$ctrl.hasParameters()">
                        <dynamic-parameter
                            ng-repeat="param in $ctrl.parameters"
                            name="{{param.name}}"
                            schema="param"
                            ng-model="$ctrl.plugin.config.parameters[param.name]"
                        ></dynamic-parameter>
                    </div>
                </eos-container>
            </div>
            <div class="modal-footer sticky-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.cancel()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">{{$ctrl.isNewInstall ? "Install" : "Save"}}</button>
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

                $ctrl.$onInit = function() {
                    $ctrl.plugin = $ctrl.resolve.plugin;
                    $ctrl.isNewInstall = $ctrl.resolve.isNewInstall === true;

                    if (!$ctrl.plugin.config.parameters) {
                        $ctrl.plugin.config.parameters = {};
                    }

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
                };

                $ctrl.hasParameters = function() {
                    return Array.isArray($ctrl.parameters) && $ctrl.parameters.length > 0;
                };

                $ctrl.openWebsite = function() {
                    if ($ctrl.plugin.details.manifest.website) {
                        $rootScope.openLinkExternally($ctrl.plugin.details.manifest.website);
                    }
                };

                $ctrl.save = function() {
                    pluginsService.savePluginConfig($ctrl.plugin.config).then(() => {
                        $ctrl.close({ $value: { saved: true } });
                    });
                };

                $ctrl.cancel = function() {
                    $ctrl.dismiss();
                };
            }
        });
}());

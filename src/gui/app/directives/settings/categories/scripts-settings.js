"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("scriptsSettings", {
            template: `
                <div>

                    <firebot-setting
                        name="Custom Scripts"
                        description="Firebot supports custom scripts! You must opt-in to use this feature as it is potentially dangerous. Please only run scripts from sources you trust."
                    >
                        <setting-description-addon>
                            <div style="margin-top: 10px;">Want to write your own scripts? Learn how <a
                                class="clickable"
                                ng-click="openLink('https://github.com/crowbartools/Firebot/wiki/Writing-Custom-Scripts')"
                            >here</a
                            >.</div>
                        </setting-description-addon>
                        <firebot-select
                            options="{ true: 'Enabled', false: 'Disabled' }"
                            ng-init="customScriptsEnabled = settings.getSetting('RunCustomScripts')"
                            selected="customScriptsEnabled"
                            on-update="settings.saveSetting('RunCustomScripts', option === 'true')"
                            right-justify="true"
                            aria-label="Enable or disable custom scripts"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Startup Scripts"
                        description="Startup Scripts are custom scripts that run when Firebot starts. Scripts which add new effects, variables, event types, etc should be loaded here."
                    >
                        <firebot-button
                            text="Manage Startup Scripts"
                            disabled="!settings.getSetting('RunCustomScripts')"
                            ng-click="openStartupScriptsModal()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Clear Custom Script Cache"
                        description="Whether or not you want custom scripts to be cleared from memory before they are executed. Enabling this helps when actively developing a custom script, otherwise Firebot wont reflect changes to your script until restarted. Everyday users should leave this disabled."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="clearCache = settings.getSetting('ClearCustomScriptCache')"
                            is-disabled="!settings.getSetting('RunCustomScripts')"
                            selected="clearCache"
                            on-update="settings.saveSetting('ClearCustomScriptCache', option === 'true')"
                            right-justify="true"
                            aria-label="Enable or disable the Clearing of Custom Script Cache"
                        />
                    </firebot-setting>


                </div>
          `,
            controller: function($rootScope, $scope, settingsService, utilityService) {
                $scope.openLink = $rootScope.openLinkExternally;
                $scope.settings = settingsService;

                $scope.openStartupScriptsModal = function() {
                    utilityService.showModal({
                        component: "startupScriptsListModal",
                        size: "sm",
                        backdrop: true,
                        keyboard: true
                    });
                };

            }
        });
}());

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
                        <toggle-button
                            toggle-model="settings.getSetting('RunCustomScripts')"
                            on-toggle="settings.saveSetting('RunCustomScripts', !settings.getSetting('RunCustomScripts'))"
                            font-size="40"
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
                        <toggle-button
                            toggle-model="settings.getSetting('ClearCustomScriptCache')"
                            on-toggle="settings.saveSetting('ClearCustomScriptCache', !settings.getSetting('ClearCustomScriptCache'))"
                            disabled="!settings.getSetting('RunCustomScripts')"
                            font-size="40"
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
                        size: "md",
                        backdrop: true,
                        keyboard: true
                    });
                };

            }
        });
}());

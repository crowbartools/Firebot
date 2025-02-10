"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("overlaySettings", {
            template: `
                <div>

                    <firebot-setting
                        name="Overlay URL"
                        description="Open the Overlay Setup modal to get access to the url and how to set it up."
                    >
                        <firebot-button
                            text="Get Overlay Path"
                            ng-click="showOverlayInfoModal()"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Overlay Instances"
                        description="Enable or disable the ability to use multiple overlay instances in your broadcasting software. When on, you will be able to pick which instance you want a video or image effect to show in. This is useful if you use greenscreen footage that you need to chroma key but don't want to affect your other videos and images."
                    >
                        <span
                            style="padding-right: 10px"
                            ng-if="settings.getSetting('UseOverlayInstances')"
                        >
                            <a href ng-click="showEditOverlayInstancesModal()">Edit Instances</a>
                        </span>
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="overlayInstances = settings.getSetting('UseOverlayInstances')"
                            selected="overlayInstances"
                            on-update="settings.saveSetting('UseOverlayInstances', option === 'true')"
                            right-justify="true"
                            aria-label="enable or disable Overlay Instances"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Force Effects to Continue on Overlay Refresh"
                        description="When refreshing an overlay or using the Clear Effects effect on it, this will force
                        any Play Video or Play Sound effects currently playing on that overlay to continue to the next effect,
                        even if they're set to wait."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('ForceOverlayEffectsToContinueOnRefresh')"
                            on-toggle="settings.saveSetting('ForceOverlayEffectsToContinueOnRefresh', !settings.getSetting('ForceOverlayEffectsToContinueOnRefresh'))"
                            font-size="40"
                            accessibility-label="(settings.getSetting('ForceOverlayEffectsToContinueOnRefresh') ? 'Enabled' : 'Disabled') + '
                             When refreshing an overlay or using the Clear Effects effect on it, this will force any Play Video or Play
                             Sound effects currently playing on that overlay to continue to the next effect, even if they\\'re set to wait.'"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Font Management"
                        description="Manage fonts for use with the Show Text effect in the overlay. Any changes to fonts will require a restart to Firebot and then refreshing the overlay."
                    >
                        <firebot-button
                            text="Manage Fonts"
                            ng-click="showFontManagementModal()"
                        />
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService, utilityService) {
                $scope.settings = settingsService;

                $scope.showOverlayInfoModal = function(overlayInstance) {
                    utilityService.showOverlayInfoModal(overlayInstance);
                };

                $scope.showEditOverlayInstancesModal = function() {
                    utilityService.showModal({
                        component: "editOverlayInstancesModal"
                    });
                };

                $scope.showFontManagementModal = function() {
                    utilityService.showModal({
                        component: "fontManagementModal",
                        size: "sm"
                    });
                };
            }
        });
}());

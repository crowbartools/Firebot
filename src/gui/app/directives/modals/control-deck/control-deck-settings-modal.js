"use strict";

(function() {
    angular.module("firebotApp").component("controlDeckSettingsModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Control Deck Settings</h4>
            </div>
            <div class="modal-body">
                <div class="form-group flex-row jspacebetween mb-0">
                    <div>
                        <label class="control-label" style="margin:0;font-size: 18px;">Enable Control Deck</label>
                        <p class="help-block pr-8">When enabled, the Control Deck page can be opened from a phone or tablet on your local network.</p>
                    </div>
                    <div>
                        <toggle-button toggle-model="$ctrl.settings.enabled" auto-update-value="true" font-size="40"></toggle-button>
                    </div>
                </div>

                <h4 style="margin-top: 20px;">PIN <span class="muted" style="font-weight: 400;">(optional)</span></h4>
                <p class="muted">Require this PIN to open the page and press buttons. Leave blank for no PIN.</p>
                <input type="text" class="form-control" style="max-width: 220px;" ng-model="$ctrl.settings.pin" placeholder="No PIN">

                <h4 style="margin-top: 20px;">Orientation</h4>
                <firebot-radio-cards
                    options="$ctrl.orientationOptions"
                    ng-model="$ctrl.settings.orientationMode"
                    grid-columns="2"
                ></firebot-radio-cards>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(settingsService) {
            const $ctrl = this;

            $ctrl.settings = {
                enabled: false,
                pin: "",
                orientationMode: "dynamic"
            };

            $ctrl.orientationOptions = [
                {
                    value: "dynamic",
                    label: "Dynamic",
                    description: "The grid rotates to best fill the screen",
                    iconClass: "fa-sync"
                },
                {
                    value: "fixed",
                    label: "Fixed",
                    description: "The grid maintains its designed layout regardless of device orientation",
                    iconClass: "fa-lock"
                }
            ];

            $ctrl.$onInit = () => {
                $ctrl.settings.enabled = settingsService.getSetting("ControlDeckEnabled");
                $ctrl.settings.pin = settingsService.getSetting("ControlDeckPin") || "";
                $ctrl.settings.orientationMode = settingsService.getSetting("ControlDeckOrientationMode");
            };

            $ctrl.save = () => {
                settingsService.saveSetting("ControlDeckEnabled", $ctrl.settings.enabled === true);
                settingsService.saveSetting("ControlDeckPin", $ctrl.settings.pin || "");
                settingsService.saveSetting("ControlDeckOrientationMode", $ctrl.settings.orientationMode || "dynamic");
                $ctrl.close();
            };
        }
    });
}());

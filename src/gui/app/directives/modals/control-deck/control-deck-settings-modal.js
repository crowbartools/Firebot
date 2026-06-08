"use strict";

(function() {
    const QRCode = require("qrcode");

    angular.module("firebotApp").component("controlDeckSettingsModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Control Deck Settings</h4>
            </div>
            <div class="modal-body">
                <firebot-checkbox
                    label="Enable Control Deck"
                    model="$ctrl.settings.enabled"
                    on-change="$ctrl.onEnabledChanged()"
                ></firebot-checkbox>
                <p class="muted" style="margin-top: 4px;">When enabled, the Control Deck page can be opened from a phone or tablet on your local network.</p>

                <h4 style="margin-top: 20px;">PIN <span class="muted" style="font-weight: 400;">(optional)</span></h4>
                <p class="muted">Require this PIN to open the page and press buttons. Leave blank for no PIN.</p>
                <input type="text" class="form-control" style="max-width: 220px;" ng-model="$ctrl.settings.pin" placeholder="No PIN">

                <h4 style="margin-top: 20px;">Orientation</h4>
                <dropdown-select
                    options="$ctrl.orientationOptions"
                    selected="$ctrl.settings.orientationMode"
                ></dropdown-select>
                <p class="muted" style="margin-top: 4px;">
                    <b>Fixed:</b> the grid keeps its designed layout regardless of how the device is held.<br>
                    <b>Dynamic:</b> the grid rotates to best fill the screen when the device is rotated.
                </p>

                <div ng-show="$ctrl.settings.enabled" style="margin-top: 25px;">
                    <h4>Open on a device</h4>
                    <p class="muted">Scan this QR code with your phone or tablet, or visit the URL in a browser.</p>
                    <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
                        <img ng-if="$ctrl.qrDataUrl" ng-src="{{$ctrl.qrDataUrl}}" alt="Control Deck QR code" style="width: 180px; height: 180px; background: #fff; border-radius: 8px; padding: 8px;" />
                        <div style="flex: 1; min-width: 240px;">
                            <copy-text-display text="$ctrl.url" tooltip-text="Copy Control Deck URL"></copy-text-display>
                        </div>
                    </div>
                </div>
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
        controller: function($scope, controlDeckService, settingsService, backendCommunicator, ngToast) {
            const $ctrl = this;

            $ctrl.settings = {
                enabled: false,
                pin: "",
                orientationMode: "dynamic"
            };

            $ctrl.url = "";
            $ctrl.qrDataUrl = "";

            $ctrl.orientationOptions = {
                "dynamic": "Dynamic",
                "fixed": "Fixed"
            };

            $ctrl.$onInit = () => {
                $ctrl.settings.enabled = settingsService.getSetting("ControlDeckEnabled");
                $ctrl.settings.pin = settingsService.getSetting("ControlDeckPin") || "";
                $ctrl.settings.orientationMode = settingsService.getSetting("ControlDeckOrientationMode");

                backendCommunicator
                    .fireEventAsync("get-ip-address")
                    .then((ip) => {
                        const port = settingsService.getSetting("WebServerPort");
                        const host = ip || "localhost";
                        $ctrl.url = `http://${host}:${port}/control-deck/`;
                        $ctrl.generateQr();
                    });
            };

            $ctrl.onEnabledChanged = () => {
                if ($ctrl.settings.enabled && !$ctrl.qrDataUrl && $ctrl.url) {
                    $ctrl.generateQr();
                }
            };

            $ctrl.generateQr = () => {
                if (!$ctrl.url) {
                    return;
                }
                QRCode.toDataURL($ctrl.url, { width: 360, margin: 1 }, (err, dataUrl) => {
                    if (err) {
                        return;
                    }
                    $scope.$applyAsync(() => {
                        $ctrl.qrDataUrl = dataUrl;
                    });
                });
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

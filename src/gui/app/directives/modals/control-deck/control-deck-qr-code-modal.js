"use strict";

(function() {
    const QRCode = require("qrcode");

    angular.module("firebotApp").component("controlDeckQrCodeModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Control Deck QR Code</h4>
            </div>
            <div class="modal-body">
                <p class="muted text-center">Scan this QR code with your phone or tablet, or visit the URL in a browser.</p>
                <div class="flex flex-column items-center justify-center gap-4">
                    <dropdown-select
                        options="$ctrl.urlModeOptions"
                        selected="$ctrl.urlMode"
                        on-update="$ctrl.onUrlModeChange()"
                    ></dropdown-select>
                    <img ng-if="$ctrl.qrDataUrl" ng-src="{{$ctrl.qrDataUrl}}" alt="Control Deck QR code" class="my-6" style="width: 180px; height: 180px; background: #fff; border-radius: 8px; padding: 8px;" />
                    <div style="flex: 1;" class="w-full">
                        <copy-text-display text="$ctrl.url" tooltip-text="Copy Control Deck URL"></copy-text-display>
                    </div>
                    <div class="w-full mt-5">
                        <collapsable-panel header="iOS Troubleshooting Tips">
                            <p>If you encounter a "cannot open in https-only mode" error on iOS, follow these steps:</p>
                            <ol>
                                <li>Open the Settings app</li>
                                <li>Navigate to Safari app settings</li>
                                <li>Under the "Privacy & Security" section, disable "Not Secure Connection Warning"</li>
                            </ol>
                            <p>If you want more screen real estate:</p>
                            <ol>
                                <li>Open the Control Deck page in Safari</li>
                                <li>Press the Share button and select "Add to Home Screen"</li>
                                <li>Make sure "Open as Web App" is enabled</li>
                            </ol>
                        </collapsable-panel>
                    </div>
                   <div class="w-full mt-5">
                        <collapsable-panel header="Android Troubleshooting Tips">
                            <p>If you have issues loading the page, try the following:</p>
                            <ol>
                                <li>Switch to the "Direct IP" url above and scan the QR code again</li>
                            </ol>
                        </collapsable-panel>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
            </div>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function($scope, settingsService, backendCommunicator) {
            const $ctrl = this;

            $ctrl.url = "";
            $ctrl.qrDataUrl = "";

            $ctrl.urlMode = "local";
            $ctrl.urlModeOptions = {
                local: "Local URL",
                direct: "Direct IP"
            };

            let directHost = null;
            let localHost = null;

            function buildUrl() {
                const port = settingsService.getSetting("WebServerPort");
                let host;
                if ($ctrl.urlMode === "local") {
                    host = localHost || directHost || "localhost";
                } else {
                    host = directHost || "localhost";
                }
                $ctrl.url = `http://${host}:${port}/control-deck/`;
                $ctrl.generateQr();
            }

            $ctrl.onUrlModeChange = () => {
                buildUrl();
            };

            $ctrl.$onInit = () => {
                Promise.all([
                    backendCommunicator.fireEventAsync("get-ip-address"),
                    backendCommunicator.fireEventAsync("get-bonjour-host")
                ]).then(([ip, bonjourHost]) => {
                    directHost = ip || null;
                    localHost = bonjourHost || null;

                    // Default to Direct IP if the local hostname isn't available
                    if (localHost == null) {
                        $ctrl.urlMode = "direct";
                    }

                    $scope.$applyAsync(() => {
                        buildUrl();
                    });
                });
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
        }
    });
}());

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
                    <img ng-if="$ctrl.qrDataUrl" ng-src="{{$ctrl.qrDataUrl}}" alt="Control Deck QR code" class="my-6" style="width: 180px; height: 180px; background: #fff; border-radius: 8px; padding: 8px;" />
                    <div style="flex: 1;" class="w-full">
                        <copy-text-display text="$ctrl.url" tooltip-text="Copy Control Deck URL"></copy-text-display>
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

            $ctrl.$onInit = () => {
                backendCommunicator
                    .fireEventAsync("get-ip-address")
                    .then((ip) => {
                        const port = settingsService.getSetting("WebServerPort");
                        const host = ip || "localhost";
                        $ctrl.url = `http://${host}:${port}/control-deck/`;
                        $ctrl.generateQr();
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

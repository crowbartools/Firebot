"use strict";

(function() {
    angular.module("firebotApp")
        .component("overlayInfoModal", {
            template: `
                <div class="modal-header" style="text-align:center;">
                    <h2 class="modal-title">Overlay Setup</h2>
                    <button type="button" class="close" aria-label="Close" ng-click="dismiss()" style="position: absolute;right: 25px;"><span aria-hidden="true">&times;</span></button>
                </div>
                <div class="modal-body" style="padding: 30px; font-weight: 100;">
                    <div ng-hide="showingInstance" style="margin-bottom: 25px;">
                        <p style="font-size: 15px; margin-bottom: 20px;">
                            To display images, videos, and other visual effects on stream, add Firebot's overlay to your broadcasting software.
                        </p>

                        <h4 style="margin-bottom: 15px; font-weight: 600;">Setup Instructions</h4>
                        <ol style="text-align: left; line-height: 1.8; padding-left: 20px; max-width: 600px; margin: 0 auto;">
                            <li>In your broadcasting software, add a <b>Browser Source</b></li>
                            <li>Select your setup type below and copy the URL</li>
                            <li>Paste the URL into the browser source's URL field</li>
                            <li>Set the browser source dimensions to match your canvas (e.g., 1920×1080)</li>
                        </ol>
                        <p style="margin-top: 15px; font-size: 13px; color: #888;">
                            <b>Important:</b> Do not select "Local file" when adding the browser source.
                        </p>
                    </div>

                    <div style="max-width: 600px; margin: 0 auto;">
                        <label style="display: block; text-align: left; margin-bottom: 8px; font-weight: 500;">Setup Type</label>
                        <firebot-radio-cards
                            options="streamSetups"
                            ng-model="selectedSetup"
                            ng-change="selectedSetupChanged()"
                            grid-columns="2"
                        ></firebot-radio-cards>

                        <label style="display: block; text-align: left; margin-bottom: 8px; font-weight: 500; margin-top: 10px;">URL</label>
                        <copy-text-display
                            text="overlayPath"
                            tooltip-text="Copy overlay URL to clipboard"
                        ></copy-text-display>
                    </div>

                </div>
                <div class="modal-footer" style="text-align:center;"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(
                $scope,
                settingsService,
                dataAccess,
                backendCommunicator
            ) {
                const $ctrl = this;

                $scope.usingOverlayInstances = settingsService.getSetting("UseOverlayInstances");

                $scope.streamSetups = [
                    {
                        value: "local",
                        label: "Single Computer",
                        iconClass: "fa-desktop",
                        tooltip: "You run Firebot and your broadcasting software on the same computer."
                    },
                    {
                        value: "two-pc",
                        label: "Two Computers",
                        iconClass: "fa-network-wired",
                        tooltip: "You run Firebot and your broadcasting software on separate computers."
                    }
                ];

                $scope.selectedSetup = "local";

                $scope.selectedSetupChanged = () => {
                    $scope.buildOverlayPath();
                };

                $scope.ipAddress = "";
                backendCommunicator
                    .fireEventAsync("get-ip-address")
                    .then((ip) => {
                        $scope.ipAddress = ip;
                        $scope.buildOverlayPath();
                    });

                $scope.overlayPath = "";
                $scope.buildOverlayPath = () => {
                    let overlayPath = dataAccess.getPathInUserData("overlay.html");

                    const port = settingsService.getSetting("WebServerPort");

                    const params = {};
                    if ($scope.selectedSetup === "two-pc") {
                        const ipAddress = $scope.ipAddress || "localhost";
                        overlayPath = `http://${ipAddress}:${port}/overlay`;

                    } else {
                        if (port !== 7472 && !isNaN(port)) {
                            params["port"] = settingsService.getSetting("WebServerPort");
                        }
                        overlayPath = `file:///${overlayPath.replace(/^\//g, "")}`;
                    }

                    const instanceName = $ctrl.resolve.instanceName;

                    if (instanceName != null && instanceName !== "") {
                        $scope.showingInstance = true;
                        params["instance"] = encodeURIComponent(instanceName);
                    }

                    let paramCount = 0;
                    Object.entries(params).forEach((p) => {
                        const key = p[0],
                            value = p[1];

                        const prefix = paramCount === 0 ? "?" : "&";

                        overlayPath += `${prefix}${key}=${value}`;

                        paramCount++;
                    });

                    $scope.overlayPath = overlayPath;
                };

                $ctrl.$onInit = () => {
                    $scope.buildOverlayPath();
                };

                $scope.dismiss = function() {
                    $ctrl.dismiss();
                };
            }
        });
}());

"use strict";
(function() {
    angular
        .module("firebotApp")
        .component("updateIndicator", {
            bindings: {},
            template: `
                <div class="update-indicator-wrapper" ng-if="$ctrl.updateIsAvailable()">
                    <button
                        class="app-bar-icon-btn"
                        aria-label="Update Available"
                        ng-click="$ctrl.showUpdateModal()"
                        uib-tooltip-html="$ctrl.tooltip"
                        tooltip-append-to-body="true"
                        tooltip-placement="bottom-right"
                    >
                        <i class="far fa-download"></i>
                        <span class="update-indicator-badge"></span>
                    </button>
                </div>
            `,
            controller: function($scope, updatesService, utilityService) {
                const ctrl = this;

                function updateTooltip() {
                    if (updatesService.newBetaAvailable) {
                        ctrl.tooltip = "<b>Firebot Beta Update Available</b><br/>Beta update is available. Click to view the release notes and to download the update.";
                    } else if (process.platform === 'win32' && updatesService.willAutoUpdate) {
                        ctrl.tooltip = "<b>Firebot Update Available</b><br/>Update is available and will be installed next time you close/reopen Firebot.";
                    } else {
                        ctrl.tooltip = "<b>Firebot Update Available</b><br/>Click to view the release notes and to download the update.";
                    }
                }

                updateTooltip();

                $scope.$watchGroup([
                    () => updatesService.newBetaAvailable,
                    () => updatesService.willAutoUpdate
                ], function() {
                    updateTooltip();
                });

                ctrl.updateIsAvailable = () => {
                    return updatesService.updateIsAvailable();
                };

                ctrl.showUpdateModal = () => {
                    utilityService.showModal({
                        component: "updateModal",
                        backdrop: false
                    });
                };
            }
        });
}());
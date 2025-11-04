"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module("firebotApp")
        .component("updateIndicator", {
            bindings: {},
            template: `
                <div class="update-indicator-wrapper">
                    <div 
                        aria-label="Update Available" 
                        ng-if="$ctrl.updateIsAvailable()" 
                        ng-click="$ctrl.showUpdateModal()"
                        uib-tooltip-html="$ctrl.tooltip" 
                        tooltip-append-to-body="true" 
                        tooltip-placement="bottom-right"
                    >
                        <i class="far fa-download" style="cursor:pointer;"></i>
                    </div>
                </div>
            `,
            controller: function(updatesService, utilityService) {
                const ctrl = this;

                if (process.platform === 'win32') {
                    ctrl.tooltip = "<b>Firebot Update Ready:</b> Update will be installed next time you close/reopen Firebot.";
                } else {
                    ctrl.tooltip = "<b>Firebot Update Ready:</b> Click to view the release notes and to update.";
                }

                ctrl.updateIsAvailable = () => {
                    return updatesService.updateIsDownloaded;
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
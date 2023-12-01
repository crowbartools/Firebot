"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module("firebotApp")
        .component("updateIndicator", {
            bindings: {},
            template: `
        <div class="update-indicator-wrapper">
            <div aria-label="Update Available" ng-if="$ctrl.updateIsAvailable()" uib-tooltip-html="$ctrl.tooltip" tooltip-append-to-body="true" tooltip-placement="bottom-right">
                <i class="far fa-download" style="cursor:pointer;"></i>
            </div>
        </div>
            `,
            controller: function(
                $scope,
                updatesService
            ) {
                const ctrl = this;

                ctrl.tooltip = "<b>Firebot Update Ready:</b> Update will be installed next time you close/reopen Firebot.";

                ctrl.updateIsAvailable = () => {
                    return updatesService.updateIsDownloaded;
                };
            }
        });
}());
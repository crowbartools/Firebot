"use strict";

(function() {
    angular.module("firebotApp")
        .component("rewardQueueModal", {
            template: `
                <div class="modal-header" style="border-bottom: 2px solid rgb(128 128 128 / 0.33);">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Reward Request Queue</h4>
                </div>
                <div class="modal-body reward-queue-modal-content">
                    <channel-reward-queue-manager />
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {}
        });
}());

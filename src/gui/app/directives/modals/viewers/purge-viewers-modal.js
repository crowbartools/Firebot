"use strict";

(function() {
    angular.module("firebotApp")
        .component("purgeViewersModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Purge Viewers</h4>
                </div>
                <div class="modal-body">
                    <div>
                        <h4 style="margin-top: 15px;">Twitch</h4>
                        <b>Purge viewers who...</b>
                        <label class="control-fb control--checkbox" style="font-size: 13px;margin-top: 5px;"> Haven't been active for more than X days
                            <input type="checkbox" ng-model="$ctrl.options.daysSinceActive.enabled">
                            <div class="control__indicator"></div>
                        </label>
                        <div style="padding: 0 0 20px 0px;" ng-show="$ctrl.options.daysSinceActive.enabled">
                            <form class="form-inline">
                                <div class="form-group">
                                    <span>Days: </span>
                                    <input type="number" class="form-control" ng-model="$ctrl.options.daysSinceActive.value" style="width: 85px;">
                                </div>
                            </form>
                        </div>
                        <label class="control-fb control--checkbox" style="font-size: 13px;"> Have a view time of less than X hours
                            <input type="checkbox" ng-model="$ctrl.options.viewTimeHours.enabled">
                            <div class="control__indicator"></div>
                        </label>
                        <div style="padding: 0 0 20px 0px;" ng-show="$ctrl.options.viewTimeHours.enabled">
                            <form class="form-inline">
                                <div class="form-group">
                                    <span>Hours: </span>
                                    <input type="number" class="form-control" ng-model="$ctrl.options.viewTimeHours.value" style="width: 85px;">
                                </div>
                            </form>
                        </div>
                        <label class="control-fb control--checkbox" style="font-size: 13px;"> Have sent less than X chat messages
                            <input type="checkbox" ng-model="$ctrl.options.chatMessagesSent.enabled">
                            <div class="control__indicator"></div>
                        </label>
                        <div style="padding: 0 0 20px 0px;" ng-show="$ctrl.options.chatMessagesSent.enabled">
                            <form class="form-inline">
                                <div class="form-group">
                                    <span>Messages: </span>
                                    <input type="number" class="form-control" ng-model="$ctrl.options.chatMessagesSent.value" style="width: 85px;">
                                </div>
                            </form>
                        </div>
                        <p class="muted">Note: Viewers must meet all of the selected criteria above to be purged (exclusive filter).</p>
                    </div>
                </div>
                <div class="modal-footer" style="text-align: center;">
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.getPurgePreview()">Preview Purge</button>
                    <button type="button" class="btn btn-danger" ng-click="$ctrl.confirmPurge()">Confirm Purge</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($q, backendCommunicator, $rootScope, utilityService, ngToast) {
                const $ctrl = this;

                $ctrl.options = {
                    daysSinceActive: {
                        enabled: false,
                        value: 0
                    },
                    viewTimeHours: {
                        enabled: false,
                        value: 0
                    },
                    chatMessagesSent: {
                        enabled: false,
                        value: 0
                    }
                };

                $ctrl.getPurgePreview = () => {
                    $rootScope.showSpinner = true;
                    $q.when(backendCommunicator.fireEventAsync("get-purge-preview", $ctrl.options))
                        .then((users) => {
                            $rootScope.showSpinner = false;
                            utilityService.showModal({
                                component: "previewPurgeModal",
                                backdrop: true,
                                resolveObj: {
                                    viewers: () => users
                                }
                            });
                        });
                };

                $ctrl.confirmPurge = () => {
                    utilityService
                        .showConfirmationModal({
                            title: "Confirm Purge",
                            question: `Are you sure you want do this purge? You can use Preview Purge first to see what you will be purging, if you want.`,
                            confirmLabel: "Purge",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                $rootScope.showSpinner = true;
                                $q.when(backendCommunicator.fireEventAsync("purge-viewers", $ctrl.options))
                                    .then((purgedCount) => {
                                        $rootScope.showSpinner = false;
                                        ngToast.create({
                                            className: 'success',
                                            content: `Successfully purged ${purgedCount} users.`
                                        });
                                        $ctrl.close();
                                    });
                            }
                        });
                };

                $ctrl.$onInit = () => {
                };
            }
        });
}());

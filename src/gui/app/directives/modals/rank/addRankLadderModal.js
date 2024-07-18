"use strict";
(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("addRankLadderModal", {
        template: `
            <div class="modal-header">
                <button
                    type="button"
                    class="close"
                    aria-label="Close"
                    ng-click="$ctrl.dismiss()"
                >
                    <i class="fal fa-times" aria-hidden="true"></i>
                </button>
                <h4 class="modal-title">
                    <div class="action text-4xl">Add Rank Ladder</div>
                </h4>
            </div>
            <div class="modal-body">
                <div>
                    <div class="modal-subheader pb-2 pt-0 px-0">
                        Name <tooltip text="'A name to help you identify this rank ladder'">
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group">
                            <input type="text" class="form-control" ng-model="$ctrl.rankLadder.name" placeholder="Enter name">
                        </div>
                    </div>
                </div>

                <div class="mt-3">
                    <div class="modal-subheader pb-2 pt-0 px-0">TYPE</div>
                    <div>
                        <ui-select ng-model="$ctrl.rankLadder.type" theme="bootstrap" class="control-type-list">
                            <ui-select-match placeholder="Select ladder type">{{$select.selected.display}}</ui-select-match>
                            <ui-select-choices repeat="type.id as type in $ctrl.ladderTypes | filter: { display: $select.search }" style="position:relative;">
                                <div class="flex-row-center">
                                    <div class="my-0 mx-5" style="width: 30px;height: 100%;font-size:20px;text-align: center;flex-shrink: 0;">
                                        <i class="fas" ng-class="type.iconClass"></i>
                                    </div>
                                    <div>
                                        <div ng-bind-html="type.display | highlight: $select.search"></div>
                                        <small class="muted">{{type.description}}</small>
                                    </div>
                                </div>
                            </ui-select-choices>
                        </ui-select>
                    </div>
                </div>

                <!-- <div class="mt-6" ng-show="$ctrl.effectQueue.mode != null && ($ctrl.effectQueue.mode ==='interval' || $ctrl.effectQueue.mode ==='auto')">
                        <div class="modal-subheader pb-2 pt-0 px-0">Interval/Delay (secs)</div>
                        <div style="width: 100%; position: relative;">
                            <div class="form-group">
                                <input type="number" class="form-control" ng-model="$ctrl.effectQueue.interval" placeholder="Enter interval">
                            </div>
                        </div>
                    </div> -->

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(viewerRanksService, ngToast) {
            const $ctrl = this;

            $ctrl.rankLadder = {
                name: "",
                type: undefined,
                enabled: true
            };

            $ctrl.$onInit = () => {};

            $ctrl.ladderTypes = viewerRanksService.ladderTypes;

            $ctrl.save = () => {
                if (!$ctrl.rankLadder.name?.length) {
                    ngToast.create("Please provide a name for this Rank Ladder");
                    return;
                }

                if ($ctrl.rankLadder.type == null) {
                    ngToast.create("Please choose a type for this Rank Ladder");
                    return;
                }

                // effectQueuesService.saveEffectQueue($ctrl.effectQueue).then(successful => {
                //     if (successful) {
                //         $ctrl.close({
                //             $value: {
                //                 effectQueue: $ctrl.effectQueue
                //             }
                //         });
                //     } else {
                //         ngToast.create("Failed to save effect queue. Please try again or view logs for details.");
                //     }
                // });
            };
        }
    });
}());

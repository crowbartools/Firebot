"use strict";
(function() {
    angular.module("firebotApp").component("addOrEditEffectQueueModal", {
        template: `
            <scroll-sentinel element-class="edit-effect-queue-header"></scroll-sentinel>
            <context-menu-modal-header
                class="edit-effect-queue-header"
                on-close="$ctrl.dismiss()"
                trigger-type="effect queue"
                trigger-name="$ctrl.effectQueue.name"
                sort-tags="$ctrl.effectQueue.sortTags"
                show-trigger-name="true"
            ></context-menu-modal-header>
            <div class="modal-body">
                <div>
                    <div class="modal-subheader pb-2 pt-0 px-0">
                        Name <tooltip text="'A name to help you identify this effect queue'">
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group">
                            <input type="text" class="form-control" ng-model="$ctrl.effectQueue.name" placeholder="Enter name">
                        </div>
                    </div>
                </div>

                <div class="mt-6">
                    <div class="modal-subheader pb-2 pt-0 px-0">MODE</div>
                    <div>
                        <ui-select ng-model="$ctrl.effectQueue.mode" theme="bootstrap" class="control-type-list">
                            <ui-select-match placeholder="Select queue mode">{{$select.selected.display}}</ui-select-match>
                            <ui-select-choices repeat="mode.id as mode in $ctrl.queueModes | filter: { display: $select.search }" style="position:relative;">
                                <div class="flex-row-center">
                                    <div class="my-0 mx-5" style="width: 30px;height: 100%;font-size:20px;text-align: center;flex-shrink: 0;">
                                        <i class="fas" ng-class="mode.iconClass"></i>
                                    </div>
                                    <div>
                                        <div ng-bind-html="mode.display | highlight: $select.search"></div>
                                        <small class="muted">{{mode.description}}</small>
                                    </div>

                                </div>

                            </ui-select-choices>
                        </ui-select>
                    </div>
                </div>

                <div class="mt-6" ng-show="$ctrl.effectQueue.mode != null && ($ctrl.effectQueue.mode ==='interval' || $ctrl.effectQueue.mode ==='auto')">
                    <div class="modal-subheader pb-2 pt-0 px-0">Interval/Delay (secs)</div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group">
                            <input type="number" class="form-control" ng-model="$ctrl.effectQueue.interval" placeholder="Enter interval">
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
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function(effectQueuesService, ngToast) {
            const $ctrl = this;

            $ctrl.isNewQueue = true;

            $ctrl.effectQueue = {
                name: "",
                mode: "custom",
                sortTags: [],
                active: true,
                length: 0
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.effectQueue) {
                    $ctrl.effectQueue = JSON.parse(
                        angular.toJson($ctrl.resolve.effectQueue)
                    );

                    $ctrl.isNewQueue = false;
                }
            };

            $ctrl.queueModes = effectQueuesService.queueModes;

            $ctrl.save = () => {
                if ($ctrl.effectQueue.name == null || $ctrl.effectQueue.name === "") {
                    ngToast.create("Please provide a name for this Effect Queue");
                    return;
                }

                if ($ctrl.effectQueue.mode === "interval" && $ctrl.effectQueue.interval == null) {
                    ngToast.create("Please choose an interval for this Effect Queue");
                    return;
                }

                effectQueuesService.saveEffectQueue($ctrl.effectQueue).then((successful) => {
                    if (successful) {
                        $ctrl.close({
                            $value: {
                                effectQueue: $ctrl.effectQueue
                            }
                        });
                    } else {
                        ngToast.create("Failed to save effect queue. Please try again or view logs for details.");
                    }
                });
            };
        }
    });
}());

"use strict";

(function () {
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

                <div class="modal-subheader pb-2 pt-0 px-0">MODE</div>
                <firebot-radio-cards
                    options="$ctrl.queueModes"
                    ng-model="$ctrl.effectQueue.mode"
                    id="queueMode"
                    name="queueMode"
                    grid-columns="1"
                ></firebot-radio-cards>

                <div class="mt-6" ng-show="$ctrl.effectQueue.mode != null && ($ctrl.effectQueue.mode ==='interval' || $ctrl.effectQueue.mode ==='auto')">
                    <div class="modal-subheader pb-2 pt-0 px-0">Interval/Delay (secs)</div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group">
                            <input type="number" class="form-control" ng-model="$ctrl.effectQueue.interval" placeholder="Enter interval">
                        </div>
                    </div>
                </div>

                <firebot-checkbox
                    label="Run Effects Immediately When Paused"
                    tooltip="When the queue is paused and effects are added to it, run them immediately instead of waiting for the queue to be resumed. This is useful if you want to temporarily pause queue functionality and have effects set to this queue to run as if there was no queue."
                    model="$ctrl.effectQueue.runEffectsImmediatelyWhenPaused"
                    style="margin-top: 15px; margin-bottom: 0px;"
                />

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
        controller: function (effectQueuesService, ngToast) {
            const $ctrl = this;

            $ctrl.isNewQueue = true;

            $ctrl.effectQueue = {
                name: "",
                mode: "auto",
                sortTags: [],
                active: true,
                length: 0,
                runEffectsImmediatelyWhenPaused: false
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

                const successful = effectQueuesService.saveEffectQueue($ctrl.effectQueue);
                if (successful) {
                    $ctrl.close({
                        $value: {
                            effectQueue: $ctrl.effectQueue
                        }
                    });
                } else {
                    ngToast.create("Failed to save effect queue. Please try again or view logs for details.");
                }
            };
        }
    });
}());
"use strict";

// Modal for adding or editting a command

(function() {
    angular.module("firebotApp").component("addOrEditTimerModal", {
        template: `
            <context-menu-modal-header
                on-close="$ctrl.dismiss()"
                trigger-type="timer"
                trigger-name="$ctrl.timer.name"
                sort-tags="$ctrl.timer.sortTags"
                show-trigger-name="true"
            ></context-menu-modal-header>
            <div class="modal-body">
                <div class="general-button-settings">
                    <div class="settings-title">
                        <h3>General Settings</h3>
                    </div>
                    <div class="input-group pb-6 settings-commandGroup-groupName">
                        <span class="input-group-addon">Name</span>
                        <input type="text" class="form-control" ng-model="$ctrl.timer.name">
                    </div>
                    <div class="input-group pb-6 settings-commandGroup-timer">
                        <span class="input-group-addon">Interval(secs)</span>
                        <input type="number" class="form-control" ng-model="$ctrl.timer.interval" placeholder="Seconds">
                    </div>
                    <div class="input-group pb-6 settings-commandGroup-timer">
                        <span class="input-group-addon">Required Chat Lines <tooltip text="'The minimum number of chat lines since the last interval.'"></tooltip></span>
                        <input type="number" class="form-control" ng-model="$ctrl.timer.requiredChatLines" placeholder="">
                    </div>
                    <div class="controls-fb-inline">
                        <label class="control-fb control--checkbox" ng-hide="$ctrl.isNewTimer">Enabled
                            <input type="checkbox" ng-model="$ctrl.timer.active" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox">Only Run When Live <tooltip text="'Uncheck this if you want this timer to run effects even when you are not live.'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.timer.onlyWhenLive" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>

                <div class="function-button-settings" style="margin-top: 15px;">
                    <effect-list
                        header="What should this timer do?"
                        effects="$ctrl.timer.effects"
                        trigger="timer"
                        trigger-meta="{ rootEffects: $ctrl.timer.effects }"
                        update="$ctrl.effectListUpdated(effects)"
                        modalId="{{$ctrl.modalId}}"
                    ></effect-list>
                </div>
                <p class="muted" style="font-size:11px;margin-top:6px;">
                    <b>ProTip:</b> If you want to have this timer display a single chat message at a time, try the <b>Run Random Effect</b> or <b>Run Sequential Effect</b>
                </p>
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
        controller: function($scope, utilityService, ngToast, timerService) {
            const $ctrl = this;

            $ctrl.timer = {
                active: true,
                onlyWhenLive: true,
                name: "",
                interval: 0,
                requiredChatLines: 5,
                sortTags: []
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.timer == null) {
                    $ctrl.isNewTimer = true;
                } else {
                    $ctrl.timer = JSON.parse(JSON.stringify($ctrl.resolve.timer));
                }

                const modalId = $ctrl.resolve.modalId;
                $ctrl.modalId = modalId;
                utilityService.addSlidingModal(
                    $ctrl.modalInstance.rendered.then(() => {
                        const modalElement = $(`.${modalId}`).children();
                        return {
                            element: modalElement,
                            name: "Edit Timer",
                            id: modalId,
                            instance: $ctrl.modalInstance
                        };
                    })
                );

                $scope.$on("modal.closing", function() {
                    utilityService.removeSlidingModal();
                });
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.timer.effects = effects;
            };

            function timerValid() {
                if ($ctrl.timer.name === "") {
                    ngToast.create("Please provide a name for the Timer.");
                    return false;
                } else if ($ctrl.timer.interval < 1) {
                    ngToast.create("Timer interval must be greater than 0.");
                    return false;
                }
                return true;
            }

            $ctrl.save = function() {
                if (!timerValid()) {
                    return;
                }

                timerService.saveTimer($ctrl.timer).then(successful => {
                    if (successful) {
                        $ctrl.close({
                            $value: {
                                timer: $ctrl.timer
                            }
                        });
                    } else {
                        ngToast.create("Failed to save timer. Please try again or view logs for details.");
                    }
                });
            };
        }
    });
}());

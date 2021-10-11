"use strict";
(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("addOrEditEffectQueueModal", {
        template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewQueue ? 'Add New Effect Queue' : 'Edit Effect Queue'}}</h4>
            </div>
            <div class="modal-body">
                <div>
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Name <tooltip text="'A name to help you identify this effect queue'">
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.nameError}">
                            <input type="text" class="form-control" ng-model="$ctrl.effectQueue.name" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter name">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.nameError">Please provide a name.</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        MODE
                    </div>
                    <div ng-class="{'has-error': $ctrl.modeError}">
                        <ui-select ng-model="$ctrl.effectQueue.mode" theme="bootstrap" class="control-type-list">
                            <ui-select-match placeholder="Select queue mode">{{$select.selected.display}}</ui-select-match>
                            <ui-select-choices repeat="mode.id as mode in $ctrl.queueModes | filter: { display: $select.search }" style="position:relative;">
                                <div class="flex-row-center">
                                    <div style="width: 30px;height: 100%;font-size:20px;margin: 0 11px;text-align: center;flex-shrink: 0;">
                                        <i class="fas" ng-class="mode.iconClass"></i>
                                    </div>
                                    <div>
                                        <div ng-bind-html="mode.display | highlight: $select.search"></div>
                                        <small class="muted">{{mode.description}}</small>
                                    </div>

                                </div>

                            </ui-select-choices>
                        </ui-select>
                        <div id="helpBlock2" class="help-block" ng-show="$ctrl.modeError">Please select a mode.</div>
                    </div>
                </div>

                <div style="margin-top: 15px;" ng-show="$ctrl.effectQueue.mode != null && $ctrl.effectQueue.mode ==='interval'">
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Interval (secs)
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.intervalError}">
                            <input type="number" class="form-control" ng-model="$ctrl.effectQueue.interval" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter interval">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.intervalError">Please provide an interval.</span>
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
            dismiss: "&"
        },
        controller: function(effectQueuesService) {
            let $ctrl = this;

            $ctrl.isNewQueue = true;

            $ctrl.effectQueue = {
                name: "",
                mode: "custom"
            };

            $ctrl.$onInit = function() {
                if ($ctrl.resolve.queue) {
                    $ctrl.effectQueue = $ctrl.resolve.queue;
                    $ctrl.isNewQueue = false;
                }
            };

            $ctrl.queueModes = effectQueuesService.queueModes;

            $ctrl.save = function() {
                if ($ctrl.effectQueue.name == null || $ctrl.effectQueue.name === "") {
                    $ctrl.nameError = true;
                } else {
                    $ctrl.nameError = false;
                }

                if ($ctrl.effectQueue.mode == null || $ctrl.effectQueue.mode === "") {
                    $ctrl.modeError = true;
                } else {
                    $ctrl.modeError = false;
                }

                if ($ctrl.effectQueue.mode === "interval" &&
                    $ctrl.effectQueue.interval == null) {
                    $ctrl.intervalError = true;
                } else {
                    $ctrl.intervalError = false;
                }

                if ($ctrl.nameError || $ctrl.modeError || $ctrl.intervalError) return;

                if ($ctrl.isNewQueue) {
                    $ctrl.effectQueue.id = uuidv1();
                }

                $ctrl.close({
                    $value: {
                        effectQueue: $ctrl.effectQueue,
                        action: $ctrl.isNewQueue ? "add" : "update"
                    }
                });
            };
        }
    });
}());

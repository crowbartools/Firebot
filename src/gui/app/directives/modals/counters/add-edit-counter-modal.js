"use strict";

(function() {
    angular.module("firebotApp").component("addOrEditCounterModal", {
        template: `
            <context-menu-modal-header
                class="edit-preset-effect-list-header"
                on-close="$ctrl.dismiss()"
                trigger-type="counter"
                trigger-name="$ctrl.counter.name"
                sort-tags="$ctrl.counter.sortTags"
                show-trigger-name="true"
            ></context-menu-modal-header>

            <div class="modal-body">
                <div>
                    <h3>Name</h3>
                    <input type="text" class="form-control" placeholder="Enter name" ng-model="$ctrl.counter.name">
                </div>

                <div class="counter-wrapper">
                    <div class="small-num clickable" ng-click="$ctrl.editMinimum()" aria-label="Edit minimum">
                        <div class="value" ng-show="$ctrl.counter.minimum != null">{{$ctrl.counter.minimum}}<span class="edit-icon"><i class="fas fa-edit"></i></span></div>
                        <div class="not-set" ng-show="$ctrl.counter.minimum == null">(Not set)<span class="edit-icon"><i class="fas fa-edit"></i></span></div>
                        <div class="counter-title">Minimum <tooltip text="'The minimum value this counter can be (optional)'"></tooltip></div>
                    </div>
                    <div class="bar"></div>
                    <div class="big-num clickable" ng-click="$ctrl.editCurrentValue()" aria-label="Edit counter's current value">
                        <div class="value">{{$ctrl.counter.value}}<span class="edit-icon"><i class="fas fa-edit"></i></span></div>
                        <div class="counter-title">Current Value</div>
                    </div>
                    <div class="bar"></div>
                    <div class="small-num clickable" ng-click="$ctrl.editMaximum()" aria-label="Edit maximum">
                        <div class="value" ng-show="$ctrl.counter.maximum != null">{{$ctrl.counter.maximum}}<span class="edit-icon"><i class="fas fa-edit"></i></span></div>
                        <div class="not-set" ng-show="$ctrl.counter.maximum == null">(Not set)<span class="edit-icon"><i class="fas fa-edit"></i></span></div>
                        <div class="counter-title">Maximum <tooltip text="'The maximum value this counter can be (optional)'"></tooltip></div>
                    </div>
                </div>

                <collapsable-panel header="How do I use this?">
                    <h3 class="use-title">How to use:</h3>
                    <p>- Automate this counter with the <b>Update Counter</b> effect on any command, button, etc.</p>
                    <p>- Access this counter's value with <b>$counter[{{$ctrl.counter.name}}]</b></p>
                    <p>- Every counter has an associated txt file with the value saved, you can add this txt file to your broadcasting software to display the value on your stream.</b></p>
                    <div><b>Txt file path for this counter:</b></div>
                    <div style="margin: 15px 0;">
                        <div class="input-group" style="width:75%;">
                            <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.txtFilePath" disabled>
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="button" ng-click="$ctrl.copyTxtFilePath()">Copy</button>
                            </span>
                        </div>
                    </div>
                </collapsable-panel>

                <div class="mt-12">
                    <h3>Effects On Update</h3>
                    <p>These effects are triggered every time the Counter value is updated by the <b>Update Counter</b> effect{{$ctrl.counter.minimum != null || $ctrl.counter.maximum != null ? ', except when the value hits the maximum or minimum' : ''}}.</p>
                    <effect-list
                        header="What should this Counter do on every update?"
                        effects="$ctrl.counter.updateEffects"
                        trigger="counter"
                        trigger-meta="{triggerId: $ctrl.counter.id,counterEffectListType: 'update', rootEffects: $ctrl.counter.updateEffects}"
                        update="$ctrl.updateEffectsListUpdated(effects)"
                        modalId="{{$ctrl.modalId}}"
                    ></effect-list>
                </div>

                <div class="mt-12" ng-show="$ctrl.counter.minimum !== undefined && $ctrl.counter.minimum !== null">
                    <h3>Effects On Minimum</h3>
                    <p>These effects are triggered when the minimum value is hit.</p>
                    <effect-list
                        header="What should this Counter do when it reaches the minimum value?"
                        effects="$ctrl.counter.minimumEffects"
                        trigger="counter"
                        trigger-meta="{triggerId: $ctrl.counter.id,counterEffectListType: 'minimum', rootEffects: $ctrl.counter.minimumEffects}"
                        update="$ctrl.minimumEffectsListUpdated(effects)"
                        modalId="{{$ctrl.modalId}}"
                    ></effect-list>
                </div>

                <div class="mt-12" ng-show="$ctrl.counter.maximum !== undefined && $ctrl.counter.maximum !== null">
                    <h3>Effects On Maximum</h3>
                    <p>These effects are triggered when the maximum value is hit.</p>
                    <effect-list
                        header="What should this Counter do when it reaches the maximum value?"
                        effects="$ctrl.counter.maximumEffects"
                        trigger="counter"
                        trigger-meta="{triggerId: $ctrl.counter.id,counterEffectListType: 'maximum', rootEffects: $ctrl.counter.maximumEffects}"
                        update="$ctrl.maximumEffectsListUpdated(effects)"
                        modalId="{{$ctrl.modalId}}"
                    ></effect-list>
                </div>
            </div>

            <div class="modal-footer sticky-footer edit-counter-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary add-new-board-save" ng-click="$ctrl.save()">Save</button>
            </div>
            <scroll-sentinel element-class="edit-counter-footer"></scroll-sentinel>
        `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function($rootScope, ngToast, countersService, utilityService) {
            const $ctrl = this;

            $ctrl.txtFilePath = "";
            $ctrl.isNewCounter = true;
            $ctrl.counter = {
                name: "",
                value: 0,
                saveToTxtFile: false,
                sortTags: []
            };

            $ctrl.copyTxtFilePath = () => {
                $rootScope.copyTextToClipboard($ctrl.txtFilePath);

                ngToast.create({
                    className: 'success',
                    content: 'Counter txt file path copied!'
                });
            };

            $ctrl.save = () => {
                if ($ctrl.counter.name == null || $ctrl.counter.name === "") {
                    ngToast.create("Please provide a name for this Counter");
                    return;
                }

                countersService.saveCounter($ctrl.counter).then((successful) => {
                    if (successful) {
                        $ctrl.close({
                            $value: {
                                counter: $ctrl.counter
                            }
                        });
                    } else {
                        ngToast.create("Failed to save counter. Please try again or view logs for details.");
                    }
                });
            };

            $ctrl.editMinimum = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.minimum,
                        inputType: "number",
                        label: "Set Minimum",
                        saveText: "Save",
                        descriptionText: "Set the minimum value this counter can be (optional).",
                        inputPlaceholder: "Enter number",
                        validationFn: async (value) => {
                            if (value != null) {
                                if ($ctrl.counter.maximum != null && value >= $ctrl.counter.maximum) {
                                    return false;
                                }
                            }

                            return true;
                        },
                        validationText: `Minimum cannot be greater than or equal to the maximum (${$ctrl.counter.maximum}).`
                    },
                    (editedValue) => {
                        $ctrl.counter.minimum = editedValue;
                        if (editedValue != null && $ctrl.counter.value < $ctrl.counter.minimum) {
                            $ctrl.counter.value = $ctrl.counter.minimum;
                        }
                    }
                );
            };

            $ctrl.editMaximum = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.maximum,
                        inputType: "number",
                        label: "Set Maximum",
                        saveText: "Save",
                        descriptionText: "Set the maximum value this counter can be (optional).",
                        inputPlaceholder: "Enter number",
                        validationFn: async (value) => {
                            if (value != null) {
                                if ($ctrl.counter.minimum != null && value <= $ctrl.counter.minimum) {
                                    return false;
                                }
                            }

                            return true;
                        },
                        validationText: `Maximum cannot be less than or equal to the minimum (${$ctrl.counter.minimum})`
                    },
                    (editedValue) => {
                        $ctrl.counter.maximum = editedValue;
                        if (editedValue != null && $ctrl.counter.value > $ctrl.counter.maximum) {
                            $ctrl.counter.value = $ctrl.counter.maximum;
                        }
                    }
                );
            };

            $ctrl.editCurrentValue = () => {
                utilityService.openGetInputModal(
                    {
                        model: $ctrl.counter.value,
                        inputType: "number",
                        label: "Set Current Value",
                        saveText: "Save",
                        descriptionText: "Update the current value for this counter.",
                        inputPlaceholder: "Enter number",
                        validationFn: async (value) => {
                            if (value == null) {
                                return {
                                    success: false,
                                    reason: `Counter value cannot be empty.`
                                };
                            }
                            if ($ctrl.counter.minimum != null && value < $ctrl.counter.minimum) {
                                return {
                                    success: false,
                                    reason: `Counter value cannot be less than the minimum (${$ctrl.counter.minimum}).`
                                };
                            } else if ($ctrl.counter.maximum != null && value > $ctrl.counter.maximum) {
                                return {
                                    success: false,
                                    reason: `Counter value cannot be greater than the maximum (${$ctrl.counter.maximum}).`
                                };
                            }
                            return true;
                        }
                    },
                    (editedValue) => {
                        $ctrl.counter.value = editedValue;
                    }
                );
            };

            $ctrl.updateEffectsListUpdated = (effects) => {
                $ctrl.counter.updateEffects = effects;
            };
            $ctrl.maximumEffectsListUpdated = (effects) => {
                $ctrl.counter.maximumEffects = effects;
            };
            $ctrl.minimumEffectsListUpdated = (effects) => {
                $ctrl.counter.minimumEffects = effects;
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.counter) {
                    $ctrl.counter = JSON.parse(
                        angular.toJson($ctrl.resolve.counter)
                    );

                    if ($ctrl.counter.sortTags == null) {
                        $ctrl.counter.sortTags = [];
                    }

                    $ctrl.isNewCounter = false;
                }

                $ctrl.txtFilePath = countersService.getTxtFilePath($ctrl.counter.name);
            };
        }
    });
}());

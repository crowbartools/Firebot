"use strict";

(function() {
    angular.module("firebotApp")
        .component("conditionList", {
            bindings: {
                header: "@",
                prefix: "@",
                conditionData: "=",
                trigger: "<",
                triggerMeta: "<",
                update: "&",
                modalId: "@"
            },
            template: `
            <div>
                <h3 ng-if="$ctrl.header != '' && $ctrl.header != null" style="margin-bottom: 5px;text-transform: uppercase;font-weight: bold;">{{$ctrl.header}}</h3>
                <div>
                    <div style="padding-bottom: 4px;padding-left: 2px;font-size: 15px;font-family: 'Quicksand'; color: #c0c1c2;" ng-if="$ctrl.hasConditionsAvailable()">
                        <span>{{$ctrl.prefix || "If"}} </span>
                        <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                            <div class="noselect pointer ddtext" style="font-size: 15px;">{{$ctrl.getConditionModeDisplay()}}<span class="fb-arrow down ddtext"></span></div>
                            <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>
                                <li ng-click="$ctrl.conditionData.mode = 'exclusive'">
                                    <a style="padding-left: 10px;">all</a>
                                </li>

                                <li ng-click="$ctrl.conditionData.mode = 'inclusive'">
                                    <a style="padding-left: 10px;">any</a>
                                </li>
                            </ul>
                        </div>
                        <span> of the following conditions pass:</span>
                    </div>
                    <div style="display:flex;flex-wrap: wrap;">
                        <button ng-repeat="condition in $ctrl.conditionData.conditions track by $index" class="filter-bar" style="max-width: 100%;" ng-click="$ctrl.openAddOrEditConditionModal($index)">
                            <condition-display condition="condition" condition-type="$ctrl.getConditionType(condition.type)" style="width: 94%"></condition-display>
                            <a class="filter-remove-btn clickable" style="margin-left: 10px; flex-shrink: 0;" ng-click="$event.stopPropagation();$ctrl.removeConditionAtIndex($index)" uib-tooltip="Remove condition" tooltip-append-to-body="true">
                                <i class="far fa-times"></i>
                            </a>
                        </button>

                        <button class="filter-bar" ng-show="$ctrl.hasConditionsAvailable()" ng-click="$ctrl.openAddOrEditConditionModal()" uib-tooltip="Add new condition" tooltip-append-to-body="true">
                            <i class="far fa-plus"></i>
                        </button>
                    </div>
                    <div ng-if="!$ctrl.hasConditionsAvailable()" class="muted">There are no conditions available for this trigger.</div>
                </div>
            </div>
            `,
            controller: function(utilityService, backendCommunicator, $injector) {
                const $ctrl = this;

                // when the element is initialized
                let conditionDefintions = [];

                function validateConditionValues() {
                    if ($ctrl.conditionData && $ctrl.conditionData.conditions
                            && $ctrl.conditionData.conditions.length > 0) {

                        for (let i = 0; i < $ctrl.conditionData.conditions.length; i++) {
                            const condition = $ctrl.conditionData.conditions[i];
                            if (!condition || !condition.value) {
                                continue;
                            }

                            const conditionType = $ctrl.getConditionType(condition.type);
                            if (!conditionType) {
                                continue;
                            }

                            const valid = $injector.invoke(conditionType.valueIsStillValid, {}, {
                                condition: condition
                            });

                            if (!valid) {
                                const updatedCondition = $ctrl.conditionData.conditions[i];
                                updatedCondition.rightSideValue = undefined;
                                updatedCondition.leftSideValue = undefined;
                                $ctrl.conditionData.conditions[i] = updatedCondition;
                            }
                        }
                    }
                }

                function getConditionTypes(triggerData) {
                    return backendCommunicator
                        .fireEventSync("getConditionTypes", triggerData)
                        .map(ct => {
                            ct.getRightSidePresetValues = eval(ct.getRightSidePresetValues); // eslint-disable-line no-eval
                            ct.getLeftSidePresetValues = eval(ct.getLeftSidePresetValues); // eslint-disable-line no-eval
                            ct.getRightSideValueDisplay = eval(ct.getRightSideValueDisplay); // eslint-disable-line no-eval
                            ct.getLeftSideValueDisplay = eval(ct.getLeftSideValueDisplay); // eslint-disable-line no-eval
                            ct.valueIsStillValid = eval(ct.valueIsStillValid); // eslint-disable-line no-eval
                            return ct;
                        });
                }

                function reloadConditions() {
                    if ($ctrl.conditionData == null) {
                        $ctrl.conditionData = {
                            mode: "exclusive",
                            conditions: []
                        };
                    }
                    if ($ctrl.conditionData.conditions == null) {
                        $ctrl.conditionData.conditions = [];
                    }

                    /*
                        ,
                    */
                    conditionDefintions = getConditionTypes();
                }

                $ctrl.getConditionModeDisplay = function() {
                    return $ctrl.conditionData.mode === "inclusive" ? "any" : "all";
                };

                $ctrl.getConditionType = function(typeId) {
                    return conditionDefintions.find(fd => fd.id === typeId);
                };

                $ctrl.$onInit = function() {
                    reloadConditions();
                    validateConditionValues();
                };

                $ctrl.$onChanges = function() {
                    reloadConditions();
                };

                $ctrl.hasConditionsAvailable = function() {
                    return conditionDefintions.length > 0;
                };

                $ctrl.removeConditionAtIndex = function(index) {
                    $ctrl.conditionData.conditions.splice(index, 1);
                };

                $ctrl.openAddOrEditConditionModal = function(index) {
                    const availableConditions = getConditionTypes({
                        type: $ctrl.trigger,
                        id: $ctrl.triggerMeta && $ctrl.triggerMeta.triggerId
                    });
                    utilityService.showModal({
                        component: "addOrEditConditionModal",
                        windowClass: "fb-medium-modal",
                        resolveObj: {
                            condition: () => $ctrl.conditionData && $ctrl.conditionData.conditions[index],
                            availableConditions: () => availableConditions,
                            trigger: () => $ctrl.trigger,
                            triggerMeta: () => $ctrl.triggerMeta,
                            index: () => index
                        },
                        closeCallback: resp => {
                            const action = resp.action;

                            switch (action) {
                                case "add":
                                    $ctrl.conditionData.conditions.push(resp.condition);
                                    break;
                                case "update":
                                    $ctrl.conditionData.conditions[resp.index] = resp.condition;
                                    break;
                                case "delete":
                                    $ctrl.removeConditionAtIndex(resp.index);
                                    break;
                            }
                        }
                    });
                };
            }
        });
}());
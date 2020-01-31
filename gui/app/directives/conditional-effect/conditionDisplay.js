"use strict";
(function() {
    angular.module("firebotApp")
        .component("conditionDisplay", {
            bindings: {
                condition: "<",
                conditionType: "<"
            },
            template: `
                <span style="display: flex;justify-content: space-between;align-items: center;">
                    <b class="condition-side" style="margin-right:5px">{{$ctrl.getConditionName()}}</b> {{$ctrl.condition.comparisonType}} <b class="condition-side" style="margin-left:5px">{{$ctrl.rightSideValueDisplay}}</b>
                </span>
            `,
            controller: function($injector, $q) {
                let $ctrl = this;

                $ctrl.getConditionName = function() {
                    if ($ctrl.conditionType != null && $ctrl.conditionType.leftSideValueType != null &&
                        $ctrl.conditionType.leftSideValueType !== 'none') {
                        return $ctrl.leftSideValueDisplay;
                    }
                    return $ctrl.conditionType ? $ctrl.conditionType.name : "Unknown";
                };

                $ctrl.rightSideValueDisplay = "[Not Set]";
                $ctrl.leftSideValueDisplay = "[Not Set]";

                function getRightSideValueDisplay() {
                    return $q(async resolve => {
                        if ($ctrl.condition == null || $ctrl.condition.rightSideValue == null) {
                            resolve("[Not Set]");
                        } else {
                            let value = await $injector.invoke($ctrl.conditionType.getRightSideValueDisplay, {}, {
                                condition: $ctrl.condition
                            });
                            resolve(value);
                        }
                    });
                }

                function getLeftSideValueDisplay() {
                    return $q(async resolve => {
                        if ($ctrl.condition == null || $ctrl.condition.leftSideValue == null) {
                            resolve("[Not Set]");
                        } else {
                            let value = await $injector.invoke($ctrl.conditionType.getLeftSideValueDisplay, {}, {
                                condition: $ctrl.condition
                            });
                            resolve(value);
                        }
                    });
                }

                $ctrl.$onInit = function() {
                    getRightSideValueDisplay().then(value => {
                        $ctrl.rightSideValueDisplay = value;
                    });
                    getLeftSideValueDisplay().then(value => {
                        $ctrl.leftSideValueDisplay = value;
                    });
                };

                $ctrl.$onChanges = function() {
                    getRightSideValueDisplay().then(value => {
                        $ctrl.rightSideValueDisplay = value;
                    });
                    getLeftSideValueDisplay().then(value => {
                        $ctrl.leftSideValueDisplay = value;
                    });
                };
            }
        });
}());
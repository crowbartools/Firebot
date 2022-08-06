"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("timeInput", {
            bindings: {
                ngModel: "<",
                validationError: "<?",
                large: "<?",
                disabled: "<?"
            },
            require: { ngModelCtrl: 'ngModel' },
            template: `
                <div ng-class="{ 'has-error': $ctrl.validationError }">
                    <div class="input-group">
                        <input type="number" ng-disabled="$ctrl.disabled" ng-model="$ctrl.display" ng-change="$ctrl.valueChange()" class="form-control {{$ctrl.large ? 'input-lg' : ''}}" placeholder="Enter #">
                        <div class="input-group-btn">
                            <button type="button" style="height: 42px;" ng-disabled="$ctrl.disabled" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{$ctrl.selectedTimeUnit}} <span class="caret"></span></button>
                            <ul class="dropdown-menu dropdown-menu-right">
                                <li ng-repeat="unit in $ctrl.timeUnits" ng-click="$ctrl.updateTimeScale(unit)"><a href>{{unit}}</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.display = null;

                $ctrl.timeUnits = [
                    "Seconds",
                    "Minutes",
                    "Hours",
                    "Days"
                ];

                // units of time in secs
                const MINUTE = 60;
                const HOUR = 3600;
                const DAY = 86400;

                function getTimeScaleSeconds(unit) {
                    let timeScale = 1;
                    if (unit === "Minutes") {
                        timeScale = MINUTE;
                    } else if (unit === "Hours") {
                        timeScale = HOUR;
                    } else if (unit === "Days") {
                        timeScale = DAY;
                    }
                    return timeScale;
                }

                $ctrl.selectedTimeUnit = $ctrl.timeUnits[0];

                function determineTimeUnit(seconds) {
                    if (seconds % DAY === 0) {
                        return "Days";
                    }
                    if (seconds % HOUR === 0) {
                        return "Hours";
                    }
                    if (seconds % MINUTE === 0) {
                        return "Minutes";
                    }
                    return "Seconds";
                }

                $ctrl.valueChange = () => {
                    if ($ctrl.display == null) {
                        $ctrl.ngModel = null;
                    } else {

                        const timeScale = getTimeScaleSeconds($ctrl.selectedTimeUnit);

                        $ctrl.ngModel = $ctrl.display * timeScale;
                    }
                    $ctrl.ngModelCtrl.$setViewValue(this.ngModel);

                    $ctrl.ngModelCtrl.$setTouched();
                };

                $ctrl.updateTimeScale = (newUnit) => {
                    $ctrl.selectedTimeUnit = newUnit;
                    $ctrl.valueChange();
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.ngModel != null) {
                        $ctrl.selectedTimeUnit = determineTimeUnit($ctrl.ngModel);

                        const timeScale = getTimeScaleSeconds($ctrl.selectedTimeUnit);

                        $ctrl.display = $ctrl.ngModel / timeScale;
                    }
                };
            }
        });
}());

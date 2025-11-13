"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotSlider", {
            bindings: {
                id: "@?",
                name: "@?",
                modelValue: "=ngModel",
                options: "<?",
                leftIcon: "@?",
                rightIcon: "@?",
                label: "@?"
            },
            template: `
                <div>
                    <label ng-if="$ctrl.label" class="form-label" style="margin-bottom: 0;">{{$ctrl.label}}</label>
                    <div class="fb-slider-wrapper">
                        <i ng-if="$ctrl.leftIcon" class="slider-left-icon fas" ng-class="$ctrl.leftIcon"></i>
                        <rzslider rz-slider-model="$ctrl.modelValue" rz-slider-options="$ctrl.sliderOptions"></rzslider>
                        <i ng-if="$ctrl.rightIcon" class="slider-right-icon fas" ng-class="$ctrl.rightIcon"></i>
                    </div>
                </div>
            `,
            controller: function($scope, $timeout) {
                const $ctrl = this;

                $ctrl.sliderOptions = {};

                const init = () => {
                    $ctrl.sliderOptions = {
                        floor: 1,
                        ceil: 100,
                        step: 1,
                        hideLimitLabels: true,
                        showSelectionBar: true,
                        ...($ctrl.options ?? {})
                    };

                    $timeout(function() {
                        $scope.$broadcast("rzSliderForceRender");
                    }, 10);
                };

                $ctrl.$onChanges = init;
                $ctrl.$onInit = init;
            }
        });
}());

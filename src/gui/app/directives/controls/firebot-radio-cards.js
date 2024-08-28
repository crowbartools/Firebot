"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotRadioCards", {
            bindings: {
                options: "=",
                modelValue: "=ngModel",
                gridColumns: "<?",
                name: "@?",
                id: "@?"
            },
            require: {
                ngModelCtrl: "ngModel"
            },
            template: `
            <div name="{{$ctrl.name}}" id="{{$ctrl.id}}" class="fb-radio-card-container" ng-style="{ 'grid-template-columns': 'repeat(' + ($ctrl.gridColumns || 2) +', 1fr)' }">
                <div
                    ng-repeat="option in $ctrl.options"
                    class="fb-radio-card"
                    ng-class="{ 'selected': $ctrl.modelValue === option.value, 'justify-center': !option.description  }"
                    ng-click="$ctrl.modelValue = option.value"
                >
                    <div class="fb-radio-card-icon">
                        <i ng-if="option.iconClass" class="fal" ng-class="option.iconClass"></i>
                    </div>
                    <div class="fb-radio-card-text-container">
                        <div class="fb-radio-card-title">{{option.label}}</div>
                        <div ng-if="option.description" class="fb-radio-card-description">{{option.description}}</div>
                    </div>
                </div>
            </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.setSelected = function(value) {
                    $ctrl.modelValue = value;
                    console.log($ctrl.ngModelCtrl);
                };
            }
        });
})();

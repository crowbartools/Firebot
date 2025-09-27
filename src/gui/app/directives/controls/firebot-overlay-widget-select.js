"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotOverlayWidgetSelect", {
            bindings: {
                overlayWidgetType: "@",
                modelValue: "=ngModel",
                onSelect: "&?",
                disabled: "<?"
            },
            require: {
                ngModelCtrl: '^ngModel'
            },
            template: `
                <firebot-searchable-select
                    ng-model="$ctrl.modelValue"
                    placeholder="Select or search for a {{$ctrl.typeName}}..."
                    items="$ctrl.configs"
                    on-select="$ctrl.onSelect != null ? $ctrl.onSelect({ item: $item }) : undefined"
                    ng-disabled="$ctrl.disabled"
                ></firebot-searchable-select>
            `,
            controller: function($scope, overlayWidgetsService) {
                const $ctrl = this;

                $scope.$watch('$ctrl.modelValue', (newValue) => {
                    if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                        $ctrl.ngModelCtrl.$setViewValue(newValue);
                    }
                });

                $ctrl.$onInit = () => {
                    $ctrl.configs = overlayWidgetsService.getOverlayWidgetConfigsByType($ctrl.overlayWidgetType);

                    const widgetType = overlayWidgetsService.getOverlayWidgetType($ctrl.overlayWidgetType);
                    $ctrl.typeName = widgetType?.name ?? "widget";
                };
            }
        });
}());

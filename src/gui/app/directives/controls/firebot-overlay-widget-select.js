"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotOverlayWidgetSelect", {
            bindings: {
                overlayWidgetTypes: "<",
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
                    $ctrl.configs = overlayWidgetsService.getOverlayWidgetConfigsByTypes($ctrl.overlayWidgetTypes);

                    const widgetTypes = $ctrl.overlayWidgetTypes.map(t => overlayWidgetsService.getOverlayWidgetType(t)).filter(t => t != null);
                    $ctrl.typeName = widgetTypes.length === 1 ? widgetTypes[0].name : "widget";
                };
            }
        });
}());

"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotFontSelect", {
            bindings: {
                modelValue: "=ngModel",
                label: "@?",
                onSelect: "&?",
                disabled: "<?"
            },
            require: {
                ngModelCtrl: '^ngModel'
            },
            template: `
            <div ng-class="{'input-group': $ctrl.label}" style="width: 100%;">
                <span ng-if="$ctrl.label" class="input-group-addon">{{$ctrl.label}}</span>
                <ui-select
                    ng-model="$ctrl.modelValue"
                    on-select="$ctrl.onSelect != null ? $ctrl.onSelect({ item: $item }) : undefined"
                    theme="bootstrap"
                    class="control-type-list"
                    ng-disabled="$ctrl.disabled"
                >
                    <ui-select-match placeholder="Select or search for a font"><span ng-style="{'font-family': $select.selected}">{{$select.selected}}</span></ui-select-match>
                    <ui-select-choices repeat="fontName in $ctrl.fontNames" style="position:relative;">
                        <div class="flex-row-center">
                            <div class="px-4">
                                <div ng-bind-html="fontName | highlight: $select.search" ng-style="{'font-family': fontName}"></div>
                            </div>
                        </div>
                    </ui-select-choices>
                </ui-select>
            </div>
            `,
            controller: function($scope, fontManager) {
                const $ctrl = this;

                $ctrl.fontNames = [
                    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Inter', 'Open Sans', 'Roboto'
                ];

                $scope.$watch('$ctrl.modelValue', (newValue) => {
                    if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                        $ctrl.ngModelCtrl.$setViewValue(newValue);
                    }
                });

                $ctrl.$onInit = () => {
                    const installedFontNames = fontManager.getInstalledFonts().map(f => f.name);
                    $ctrl.fontNames = [
                        ...$ctrl.fontNames,
                        ...installedFontNames.filter(f => !$ctrl.fontNames.includes(f))
                    ];
                };
            }
        });
}());

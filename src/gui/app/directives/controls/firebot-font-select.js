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
                    <ui-select-match placeholder="Select or search for a font"><span style="font-family: '{{$select.selected}}'">{{$select.selected}}</span></ui-select-match>
                    <ui-select-choices repeat="fontName in $ctrl.fontNames | filter: $select.search | limitTo:100 track by $index" style="position:relative;">
                        <div class="flex-row-center">
                            <div class="px-4">
                                <div style="font-family: '{{fontName}}'">{{fontName}}</div>
                            </div>
                        </div>
                    </ui-select-choices>
                </ui-select>
                <div ng-if="$ctrl.systemFontsLoading" class="input-group-addon" style="width: 34px;min-width: 34px !important;" uib-tooltip="Loading system fonts..." tooltip-placement="top" tooltip-append-to-body="true">
                    <i class="fa fa-spinner-third fa-spin"></i>
                </div>
            </div>
            `,
            controller: function($scope, fontManager) {
                const $ctrl = this;

                $ctrl.fontNames = [
                    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Helvetica', 'Impact', 'Tahoma', 'Times New Roman', 'Verdana', 'Inter', 'Open Sans', 'Roboto'
                ];

                $ctrl.systemFontsLoading = false;

                $scope.$watch('$ctrl.modelValue', (newValue) => {
                    if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                        $ctrl.ngModelCtrl.$setViewValue(newValue);
                    }
                });

                $ctrl.$onInit = () => {
                    $ctrl.systemFontsLoading = true;

                    const installedFontNames = fontManager.getInstalledFonts().map(f => f.name);

                    fontManager.getSystemFonts().then((systemFonts) => {
                        $ctrl.fontNames = [...new Set([
                            ...$ctrl.fontNames,
                            ...installedFontNames,
                            ...systemFonts
                        ])].filter(f => !!f).sort((a, b) => a.localeCompare(b));
                        $ctrl.systemFontsLoading = false;
                    });
                };
            }
        });
}());

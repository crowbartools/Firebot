"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotSearchableSelect", {
            bindings: {
                modelValue: "=ngModel",
                placeholder: "@?",
                name: "@?",
                id: "@?",
                items: "<",
                itemId: "@?",
                itemName: "@?",
                itemDescription: "@?",
                itemShowDivider: "@?",
                noChoiceText: "@?",
                onSelect: "&?"
            },
            require: {
                ngModelCtrl: '^ngModel'
            },
            template: `
                <ui-select
                    input-id="{{$ctrl.id || ''}}"
                    name="{{$ctrl.name || ''}}"
                    ng-model="$ctrl.modelValue"
                    on-select="$ctrl.onSelect != null ? $ctrl.onSelect({ item: $item }) : undefined"
                    theme="bootstrap"
                    class="control-type-list"
                >
                    <ui-select-match placeholder="{{$ctrl.placeholder || ''}}">{{$select.selected[$ctrl._itemName]}}</ui-select-match>
                    <ui-select-choices repeat="item[$ctrl._itemId] as item in $ctrl.items | searchableSelectFilter:$select.search:$ctrl._itemName:$ctrl._itemDescription" style="position:relative;">
                        <li ng-if="item[$ctrl._itemShowDivider] == true" role="separator" class="divider"></li>
                        <div class="flex-row-center">
                            <div ng-if="item.iconClass" class="my-0 mx-4" style="width: 20px;height: 100%;font-size:16px;text-align: center;flex-shrink: 0;">
                                <i class="fas" ng-class="item.iconClass"></i>
                            </div>
                            <div ng-class="{ 'px-4': !item.iconClass }">
                                <div ng-bind-html="item[$ctrl._itemName] | highlight: $select.search"></div>
                                <small ng-if="item[$ctrl._itemDescription]" ng-bind-html="item[$ctrl._itemDescription] | highlight: $select.search" class="muted"></small>
                            </div>
                        </div>
                    </ui-select-choices>
                    <ui-select-no-choice ng-if="$ctrl.noChoiceText">
                        <b>{{ $ctrl.noChoiceText }}</b>
                    </ui-select-no-choice>
                </ui-select>
            `,
            controller: function($scope) {
                const $ctrl = this;

                $ctrl._itemId = 'id';
                $ctrl._itemName = 'name';
                $ctrl._itemDescription = 'description';
                $ctrl._itemShowDivider = 'divider';

                $scope.$watch('$ctrl.modelValue', (newValue) => {
                    if ($ctrl.ngModelCtrl.$viewValue !== newValue) {
                        $ctrl.ngModelCtrl.$setViewValue(newValue);
                    }
                });

                $ctrl.$onInit = () => {

                    if ($ctrl.itemId) {
                        $ctrl._itemId = $ctrl.itemId;
                    }

                    if ($ctrl.itemName) {
                        $ctrl._itemName = $ctrl.itemName;
                    }

                    if ($ctrl.itemDescription) {
                        $ctrl._itemDescription = $ctrl.itemDescription;
                    }

                    if ($ctrl.itemShowDivider) {
                        $ctrl._itemShowDivider = $ctrl.itemShowDivider;
                    }
                };
            }
        });

    angular
        .module('firebotApp')
        .filter('searchableSelectFilter', function() {
            return function(items, search, itemName, itemDescription) {
                if (!search) {
                    return items;
                }

                const keysToSearch = [
                    itemName,
                    itemDescription
                ];

                return items.filter((item) => {
                    return keysToSearch.some((key) => {
                        const value = item[key];
                        return value?.toString().toLowerCase().includes(search.toLowerCase());
                    });
                });
            };
        });
}());

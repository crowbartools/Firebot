"use strict";
(function() {
    angular.module("firebotApp").component("fbParamSortTagSelect", {
        bindings: {
            schema: '<',
            value: '<',
            onInput: '&',
            onTouched: '&'
        },
        template: `
          <div>
            <firebot-searchable-select
                ng-model="$ctrl.local"
                placeholder="Select or search for a sort tag..."
                items="sortTags"
            />
          </div>
        `,
        controller: function($scope, sortTagsService) {
            const $ctrl = this;

            $scope.sortTags = [];

            $ctrl.$onInit = function() {
                $ctrl.local = $ctrl.value;
                $scope.sortTags = sortTagsService.getSortTags($ctrl.schema.context);
            };
            $ctrl.$onChanges = function(chg) {
                if (chg.value != null && chg.value.currentValue !== $ctrl.local) {
                    $ctrl.local = chg.value.currentValue;
                }
            };
            $scope.$watch('$ctrl.local', (newValue) => {
                $ctrl.onInput({ value: newValue });
            });
        }
    });
}());
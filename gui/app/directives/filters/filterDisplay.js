"use strict";
(function() {
    angular.module("firebotApp")
        .component("filterDisplay", {
            bindings: {
                filter: "<",
                filterType: "<"
            },
            template: `
                <span>
                    <b>{{$ctrl.getFilterName()}}</b> {{$ctrl.filter.comparisonType}} <b>{{$ctrl.filterValueDisplay}}</b>
                </span>
            `,
            controller: function($injector) {
                let $ctrl = this;

                $ctrl.getFilterName = function() {
                    return $ctrl.filterType ? $ctrl.filterType.name : "Unknown";
                };

                $ctrl.filterValueDisplay = "[Not Set]";

                async function getFilterValueDisplay() {
                    if (!$ctrl.filter || !$ctrl.filter.value) return;
                    $ctrl.filterValueDisplay = await $injector.invoke($ctrl.filterType.getSelectedValueDisplay, {}, {
                        filterSettings: $ctrl.filter
                    });
                }

                $ctrl.$onInit = function() {
                    getFilterValueDisplay();
                };

                $ctrl.$onChanges = function() {
                    getFilterValueDisplay();
                };
            }
        });
}());
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
            controller: function($injector, $q) {
                let $ctrl = this;

                $ctrl.getFilterName = function() {
                    return $ctrl.filterType ? $ctrl.filterType.name : "Unknown";
                };

                $ctrl.filterValueDisplay = "[Not Set]";

                function getFilterValueDisplay() {
                    return $q(async resolve => {
                        if ($ctrl.filter == null || $ctrl.filter.value == null) {
                            resolve("[Not Set]");
                        } else {
                            let value = await $injector.invoke($ctrl.filterType.getSelectedValueDisplay, {}, {
                                filterSettings: $ctrl.filter
                            });
                            resolve(value);
                        }
                    });


                }

                $ctrl.$onInit = function() {
                    getFilterValueDisplay().then(value => {
                        $ctrl.filterValueDisplay = value;
                    });
                };

                $ctrl.$onChanges = function() {

                    getFilterValueDisplay().then(value => {
                        $ctrl.filterValueDisplay = value;
                    });
                };
            }
        });
}());
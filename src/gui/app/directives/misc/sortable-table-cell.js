"use strict";
(function() {

    angular
        .module("firebotApp")
        .directive("sortableTableCell", function($compile) {
            return {
                restrict: "E",
                scope: {
                    data: "<",
                    header: "<",
                    cellIndex: "<"
                },
                replace: true,
                template: `<div><div id="child"></div></div>`,
                link: function($scope, element) {

                    const defaultTemplate = $scope.header.dataField ? "{{data[header.dataField]}}" : "";
                    const cellTemplate = $scope.header.cellTemplate || defaultTemplate;
                    const el = angular.element(
                        `<div id="child">${cellTemplate}</div>`
                    );

                    const template = $compile(el)($scope);

                    element.children("#child").replaceWith(template);
                },
                controller: ($scope, $injector) => {
                    if ($scope.header.cellController != null) {
                        // Invoke the controller and inject any dependencies
                        $injector.invoke($scope.header.cellController, {}, { $scope: $scope });
                    }
                }
            };
        });
}());


"use strict";
(function() {
    //This adds the <effect-options> element

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

                    let defaultTemplate = $scope.header.dataField ? "{{data[header.dataField]}}" : "";
                    let cellTemplate = $scope.header.cellTemplate || defaultTemplate;
                    let el = angular.element(
                        `<div id="child">${cellTemplate}</div>`
                    );

                    let template = $compile(el)($scope);

                    element.children("#child").replaceWith(template);
                },
                controller: ($scope, $injector) => {
                    if ($scope.header.cellController != null) {
                        // Invoke the controller and inject any dependancies
                        $injector.invoke($scope.header.cellController, {}, { $scope: $scope });
                    }
                }
            };
        });
}());


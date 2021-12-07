"use strict";
(function() {

    angular
        .module("firebotApp")
        .directive("settingsCategoryContent", function($compile) {
            return {
                restrict: "E",
                scope: {
                    template: "<"
                },
                replace: true,
                template: `<div><div id="child"></div></div>`,
                link: function($scope, element) {
                    $scope.$watch("template", function() {
                        const el = angular.element(
                            `<div id="child">${$scope.template}</div>`
                        );

                        const template = $compile(el)($scope);

                        element.children("#child").replaceWith(template);
                    });
                },
                controller: () => {}
            };
        });
}());


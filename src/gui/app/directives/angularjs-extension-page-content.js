"use strict";
(function() {
    angular
        .module("firebotApp")
        .directive("angularjsExtensionPageContent", function($compile) {
            return {
                restrict: "E",
                scope: {
                    page: "="
                },
                replace: true,
                template: `<div></div>`,
                compile: function() {
                    return {
                        pre: function($scope, element) {
                            const page = $scope.page;

                            if (page == null) {
                                return;
                            }

                            const templateString = page.template || "";
                            const el = angular.element(templateString);

                            const compiledTemplate = $compile(el)($scope);

                            element.replaceWith(compiledTemplate);
                        }
                    };
                },
                controller: ($scope, $injector) => {
                    if ($scope.page?.controller) {
                        $injector.invoke($scope.page.controller, {}, { $scope: $scope });
                    }
                }
            };
        });
}());

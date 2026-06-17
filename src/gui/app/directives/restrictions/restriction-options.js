"use strict";
(function() {
    //This adds the <effect-options> element

    angular
        .module("firebotApp")
        .directive("restrictionOptions", function($compile) {
            return {
                restrict: "E",
                scope: {
                    restriction: "=",
                    restrictionDefinition: "<",
                    restrictionMode: "<",
                    trigger: "@",
                    triggerMeta: "<"
                },
                replace: true,
                template: `<div><div id="child"></div></div>`,
                link: function($scope, element) {
                    const def = $scope.restrictionDefinition;

                    const optionsTemplate = def.optionsTemplate || "";
                    const el = angular.element(
                        `<div id="child">${optionsTemplate}</div>`
                    );

                    const template = $compile(el)($scope);

                    element.children("#child").replaceWith(template);
                },
                controller: ($scope, $injector) => {

                    const def = $scope.restrictionDefinition;

                    if (def) {
                        const restrictionController = def.optionsController;

                        if (restrictionController != null) {
                            // Invoke the controller and inject any dependencies
                            $injector.invoke(restrictionController, {}, { $scope: $scope });
                        }
                    }
                }
            };
        });
}());

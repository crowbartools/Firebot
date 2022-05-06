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
                    let def = $scope.restrictionDefinition;

                    let optionsTemplate = def.optionsTemplate || "";
                    let el = angular.element(
                        `<div id="child">${optionsTemplate}</div>`
                    );

                    let template = $compile(el)($scope);

                    element.children("#child").replaceWith(template);
                },
                controller: ($scope, $injector) => {

                    let def = $scope.restrictionDefinition;

                    if (def) {
                        let restrictionController = def.optionsController;

                        if (restrictionController != null) {
                            // Invoke the controller and inject any dependancies
                            $injector.invoke(restrictionController, {}, { $scope: $scope });
                        }
                    }
                }
            };
        });
}());

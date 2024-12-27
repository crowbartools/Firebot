"use strict";
(function() {
    //This adds the <effect-options> element

    angular
        .module("firebotApp")
        .directive("effectOptions", function(effectHelperService, $compile) {
            return {
                restrict: "E",
                scope: {
                    effect: "=",
                    type: "=",
                    trigger: "@",
                    triggerMeta: "<"
                },
                replace: true,
                template: `<div><div id="child"></div></div>`,
                link: function($scope, element) {
                    $scope.$watch("type", function() {
                        const effectDef = $scope.effectDef;

                        if (effectDef == null) {
                            return;
                        }

                        const optionsTemplate = effectDef.optionsTemplate || "";
                        const el = angular.element(
                            `<div id="child">${optionsTemplate}</div>`
                        );

                        const template = $compile(el)($scope);

                        element.children("#child").replaceWith(template);
                    });
                },
                controller: ($scope, $injector, backendCommunicator) => {
                    // Add common options to the scope so we can access them in any effect option template
                    $scope.commonOptions = effectHelperService.commonOptionsForEffectTypes;

                    // We want to locate the controller of the given effect type (if there is one)
                    // and run it.
                    function findController() {

                        const effectDef = backendCommunicator.fireEventSync(
                            "getEffectDefinition",
                            $scope.type
                        );
                        $scope.effectDef = effectDef;

                        if (effectDef) {
                            // Note(erik) : I know this is bad practice, but it was the only way I could figure out
                            // how to send over a controller function thats defined in the main process over to the render process
                            // as the message system between the two sends serialized objects via JSON.stringify (which strips out funcs)
                            const effectController = eval(effectDef.optionsControllerRaw); // eslint-disable-line no-eval

                            if (effectController != null) {
                                // Invoke the controller and inject any dependencies
                                $injector.invoke(effectController, {}, { $scope: $scope });
                            }
                        }
                    }

                    // Find controller on initial load.
                    findController();

                    // Find new controller if the user changes the type via the dropdown
                    $scope.$watch("type", function(newValue, oldValue) {
                        if (newValue === oldValue) {
                            return;
                        }

                        findController();
                    });
                }
            };
        });
}());

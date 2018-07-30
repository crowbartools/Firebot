"use strict";
(function() {
  //This adds the <effect-options> element

  angular
    .module("firebotApp")
    .directive("effectOptions", function(
      effectHelperService,
      listenerService,
      $sce,
      $compile
    ) {
      return {
        restrict: "E",
        scope: {
          effect: "=",
          type: "=",
          trigger: "@"
        },
        replace: true,
        template: `<div><div id="child"></div></div>`,
        link: function($scope, element) {
          $scope.$watch("type", function() {
            //
            let templateUrlPath = effectHelperService.getTemplateFilePathForEffectType(
              $scope.type
            );
            $scope.templateUrl = templateUrlPath;

            let effectDef = listenerService.fireEventSync(
              "getEffectDefinition",
              $scope.type
            );

            let optionsTemplate = effectDef.optionsTemplate || "";
            let el = angular.element(
              `<div id="child">${optionsTemplate}</div>`
            );

            let template = $compile(el)($scope);

            console.log(element.children("#child"));
            element.children("#child").replaceWith(template);

            //$scope.template = effectDef.optionsTemplate || "";
          });
        },
        controller: ($scope, $injector, listenerService) => {
          // Add common options to the scope so we can access them in any effect option template
          $scope.commonOptions =
            effectHelperService.commonOptionsForEffectTypes;

          // We want to locate the controller of the given effect type (if there is one)
          // and run it.
          function findController() {
            /*let effectController = effectHelperService.getControllerForEffectTypeTemplate(
              $scope.trigger,
              $scope.type
            );*/

            let effectDef = listenerService.fireEventSync(
              "getEffectDefinition",
              $scope.type
            );

            // Note(erik) : I know this is bad practice, but it was the only way I could figure out
            // how to send over a controller function thats defined in the main process over to the render process
            // as the message system between the two sends serialized objects via JSON.stringify (which strips out funcs)
            let effectController = eval(effectDef.optionsControllerRaw); // eslint-disable-line no-eval

            if (effectController != null) {
              console.log(effectController);
              // Invoke the controller and inject any dependancies
              $injector.invoke(effectController, {}, { $scope: $scope });
            }
          }

          // Find controller on initial load.
          findController();

          // Find new controller if the user changes the type via the dropdown
          $scope.$watch("type", function() {
            findController();
          });
        }
      };
    });
})();

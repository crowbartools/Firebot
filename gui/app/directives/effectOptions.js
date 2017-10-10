(function(){
  
 //This adds the <effect-options> element
 
 angular
   .module('firebotApp')
   .directive('effectOptions', function(effectHelperService) {
     return {
       restrict: 'E',
       scope: {
         effect: '=',
         type: '=',
         trigger: "@"
       },
       replace: true,
       template: '<div ng-include="templateUrl"></div>',
       link: function($scope, element, attrs) {
           $scope.$watch('type', function() {
             var templateUrlPath = effectHelperService.getTemplateFilePathForEffectType($scope.type);
             $scope.templateUrl = templateUrlPath;
           });
       },
       controller: ($scope, $injector) => {
         
         // Add common options to the scope so we can access them in any effect option template
         $scope.commonOptions = effectHelperService.commonOptionsForEffectTypes;
         
         // We want to locate the controller of the given effect type (if there is one)
         // and run it.
         function findController() {
           var effectController = effectHelperService.getControllerForEffectTypeTemplate($scope.trigger, $scope.type);
           
           // Invoke the controller and inject any dependancies
           $injector.invoke(effectController, {}, { $scope: $scope });
         }
         
         // Find controller on initial load.
         findController();
         
         // Find new controller if the user changes the type via the dropdown
         $scope.$watch('type', function() {
           findController();
         });
       }
     }
   });
 })();
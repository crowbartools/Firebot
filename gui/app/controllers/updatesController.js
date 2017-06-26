(function(){
  
 //This handles the Updates tab
 
 angular
   .module('firebotApp')
   .controller('updatesController', function($sce, $scope, updatesService) {
      $scope.updates = {};

      // Get update information
      updatesService.updateCheck()
        .then(update => {
          $scope.updates = update;

          // This is required by angular to strip out bad HTML that could cause issues.
          $scope.updates.gitNotes = $sce.trustAsHtml($scope.updates.gitNotes)

          // Need this as apparently angular doesn't handle promises well and you have to
          // manually force it to update after variables change.
          $scope.$apply();
        });
   });
 })();
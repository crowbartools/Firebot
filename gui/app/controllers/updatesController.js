(function(){
  
 //This handles the Updates tab
 
 angular
   .module('firebotApp')
   .controller('updatesController', function($sce, $scope, $q, updatesService) {
      $scope.updates = {};

      // Get update information
      $q.when( updatesService.updateCheck() )
        .then(update => {
          $scope.updates = update;

          // This is required by angular to strip out bad HTML that could cause issues.
          $scope.updates.gitNotes = $sce.trustAsHtml($scope.updates.gitNotes)

        });
   });
 })();
(function(){
  
 //This handles the Logins tab and uses alot of the code from the previous login.js class
 
 angular
   .module('firebotApp')
   .controller('loginsController', function($scope, connectionService) {
      
      $scope.accounts = connectionService.accounts;
      
      // Login Kickoff
      $scope.loginOrLogout = function(type) {
        connectionService.loginOrLogout(type);
      }
      
      // Run loadLogin to update the UI on page load.
      connectionService.loadLogin();  
    });    
})();
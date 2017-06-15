(function(){

	var app = angular
		.module('firebotApp', ['ngAnimate', 'ngRoute', 'ui.bootstrap']);
    
  app.controller('MainController', ['$scope', 'boardFactory', MainController]);

	function MainController($scope, boardFactory) {
    
    const shell = require('electron').shell;

		// List of bindable properties and methods
		$scope.message = "content will go here";
    
    $scope.currentTab = "Logins";
		
		$scope.navExpanded = true;
		
		$scope.toggleNav = function() {
			$scope.navExpanded = !$scope.navExpanded;
		}
    
    $scope.setTab = function(tabId) {
      $scope.currentTab = tabId.toLowerCase();
    }
    
    $scope.tabIsSelected = function(tabId) {
      return $scope.currentTab.toLowerCase() == tabId.toLowerCase();
    }
    
    $scope.openLinkExternally = function(url) {
      shell.openExternal(url);
    }
		
		//Attempt to load interactive boards into memory
		if(!boardFactory.hasBoardsLoaded() === true) {
			boardFactory.loadAllBoards();
		} 
	}

  
  app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
            // route for the logins tab
            .when('/', {
                templateUrl : './templates/_login.html',
                controller  : 'loginsController'
            })

            // route for the interactive tab
            .when('/interactive', {
                templateUrl : './templates/_interactiveTab.html',
                controller  : 'interactiveController'
            })

            // route for the contact page
            .when('/contact', {
                templateUrl : 'pages/contact.html',
                controller  : 'contactController'
            });
  }]);
})();
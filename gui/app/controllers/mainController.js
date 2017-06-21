(function() {

const electron = require('electron');
const shell = electron.shell;

  var app = angular
    .module('firebotApp', ['ngAnimate', 'ngRoute', 'ui.bootstrap']);

  app.controller('MainController', ['$scope', 'boardService', 'connectionService', 'utilityService', MainController]);

  function MainController($scope, boardService, connectionService, utilityService) {

    // List of bindable properties and methods

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
    
    $scope.connService = connectionService;

    /**
    * Initial App Load
    */
    
    // Get app version and change titlebar.
    var appVersion = electron.remote.app.getVersion();
    var version = appVersion;
    $scope.appTitle = 'Firebot Interactive || v'+version+' || @firebottletv';
    
    //Attempt to load interactive boards into memory
    if (!(boardService.hasBoardsLoaded() == true)) {
      boardService.loadAllBoards();
    }
  }


  app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      // route for the logins tab
      .when('/', {
        templateUrl: './templates/_login.html',
        controller: 'loginsController'
      })

      // route for the interactive tab
      .when('/interactive', {
        templateUrl: './templates/interactive/_interactive.html',
        controller: 'interactiveController'
      })

      // route for the viewer groups page
      .when('/groups', {
        templateUrl: './templates/_viewergroups.html',
        controller: 'groupsController'
      })
      
      // route for the moderation page
      .when('/moderation', {
        templateUrl: './templates/_moderation.html',
        controller: 'moderationController'
      })
      
      // route for the settings page
      .when('/settings', {
        templateUrl: './templates/_settings.html',
        controller: 'settingsController'
      })
      
      // route for the updates page
      .when('/updates', {
        templateUrl: './templates/_updates.html',
        controller: 'updatesController'
      })

      // route for the credits page
      .when('/credits', {
        templateUrl: './templates/_credits.html',
        controller: 'creditsController'
      });
  }]);
  
  // This adds a filter that we can use for ng-repeat, useful when we want to paginate something
  app.filter('startFrom', function() {
    return function(input, startFrom) {
      startFrom = +startFrom;
      return input.slice(startFrom);
    }
  });
})();
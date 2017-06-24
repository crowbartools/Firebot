(function() {

const electron = require('electron');
const shell = electron.shell;

  var app = angular
    .module('firebotApp', ['ngAnimate', 'ngRoute', 'ui.bootstrap']);

  app.controller('MainController', ['$scope', '$rootScope', 'boardService', 'connectionService', 'utilityService', MainController]);

  function MainController($scope, $rootScope, boardService, connectionService, utilityService) {

    // List of bindable properties and methods

    $scope.currentTab = "Interactive";

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

    $rootScope.openLinkExternally = function(url) {
      shell.openExternal(url);
    }
    
    /**
    * Login preview stuff
    */
    $scope.accounts = connectionService.accounts;
    
    // Run loadLogin to update the UI on page load.
    connectionService.loadLogin(); 
    
    
    /**
    * Connection stuff
    */
    $scope.connService = connectionService;
    
    $scope.getConnectionMessage = function() {
      var message = ""
      if(connectionService.waitingForStatusChange) {
        connectionService.connectedToInteractive ? message = 'Disconnecting...' : message = 'Connecting...';
      } else {
        connectionService.connectedToInteractive ? message = 'Connected' : message = 'Disconnected';
      }
      return message;
    }
    
    
    /*
    * MANAGE LOGINS MODAL
    */
    $scope.showManageLoginsModal = function() {
      var showManageLoginsModal = {
        templateUrl: "manageLoginsModal.html",
        // This is the controller to be used for the modal. 
        controllerFunc: ($scope, $uibModalInstance, connectionService) => {
          $scope.accounts = connectionService.accounts;
          
          // Login Kickoff
          $scope.loginOrLogout = function(type) {
            connectionService.loginOrLogout(type);
          }    
          
          // When the user clicks "Save", we want to pass the id back to interactiveController
          $scope.close = function() {
            $uibModalInstance.close();
          };
          
          // When they hit cancel or click outside the modal, we dont want to do anything
          $scope.dismiss = function() {
            $uibModalInstance.dismiss('cancel');
          };
        }
      }      
      utilityService.showModal(showManageLoginsModal);
    };
    
    /*
    * ABOUT FIREBOT MODAL
    */
    $scope.showAboutFirebotModal = function() {
      var addBoardModalContext = {
        templateUrl: "aboutFirebotModal.html",
        // This is the controller to be used for the modal. 
        controllerFunc: ($scope, $uibModalInstance) => {
          // The model for the board id text field
          $scope.version = electron.remote.app.getVersion();
          
          // When the user clicks "Save", we want to pass the id back to interactiveController
          $scope.close = function() {
            $uibModalInstance.close();
          };
          
          // When they hit cancel or click outside the modal, we dont want to do anything
          $scope.dismiss = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
        size: 'sm'
      }      
      utilityService.showModal(addBoardModalContext);
    };
    
    /*
    * FIRST TIME USE MODAL
    */
    $scope.showFirstTimeUseModal = function() {
      var firstTimeUseModalContext = {
        templateUrl: "./templates/misc-modals/firstTimeUseModal.html",
        // This is the controller to be used for the modal. 
        controllerFunc: "firstTimeUseModalController",
        // The callback to run after the modal closed via "Add board"
        keyboard: false,
        backdrop: 'static',
        closeCallback: (data) => {
            console.log(data);
        }
      }      
      utilityService.showModal(firstTimeUseModalContext);
    };
    
  

    /**
    * Initial App Load
    */
    
    // Get app version and change titlebar.
    var appVersion = electron.remote.app.getVersion();
    var version = appVersion;
    $scope.appTitle = 'Firebot Interactive || v'+version+' || @firebottletv';
    
    //Attempt to load interactive boards into memory
    if (!boardService.hasBoardsLoaded()) {
      boardService.loadAllBoards();
    }
  }

  app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider

      // route for the interactive tab
      .when('/', {
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
  }]);
  
  // This adds a filter that we can use for ng-repeat, useful when we want to paginate something
  app.filter('startFrom', function() {
    return function(input, startFrom) {
      startFrom = +startFrom;
      return input.slice(startFrom);
    }
  });
})();
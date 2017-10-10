(function() {

  //TODO: Rename this to setupWizardModalController
  
  const dataAccess = require('../../lib/common/data-access.js');
  const fs = require('fs');
  const path = require('path');
  const ncp = require('ncp');
  
  angular
    .module('firebotApp')
    .controller('firstTimeUseModalController', function ($rootScope, $scope, $uibModalInstance, 
      $q, connectionService, boardService, settingsService, listenerService, groupsService) {

        $scope.steps = ['one', 'two', 'three', 'four', 'five', 'six'];
        $scope.stepTitles = 
          ['', 'Import Data', 'Get Signed In', 'Sync Controls From Mixer' , 'Your First Board', ''];
        $scope.step = 0;

        $scope.isFirstStep = function () {
            return $scope.step === 0;
        };

        $scope.isLastStep = function () {
            return $scope.step === ($scope.steps.length - 1);
        };

        $scope.isCurrentStep = function (step) {
            return $scope.step === step;
        };

        $scope.setCurrentStep = function (step) {
            $scope.step = step;
        };

        $scope.getCurrentStep = function () {
            return $scope.steps[$scope.step];
        };
        
        $scope.getStepTitle = function () {
          return $scope.stepTitles[$scope.step];
        }

        $scope.getNextLabel = function () {
          switch($scope.step){
            default:
              return "Next"
          }
        };

        $scope.handlePrevious = function () {
          switch($scope.step){
            case 2:
             $scope.step = 0;
             break;
            default:
              $scope.step -= ($scope.isFirstStep()) ? 0 : 1;
          }
        };
        
        $scope.showNextButton = function() {
          if($scope.isFirstStep() || $scope.isLastStep()) {
            return false;
          }
          
          if($scope.step === 1) {
            return false;
          }
          return true;
        }
        
        $scope.showBackButton = function() {
          return !($scope.isFirstStep() || $scope.isLastStep())
        }
      
        $scope.canGoToNext = function() {
          switch($scope.step){ 
            case 2:
              return connectionService.accounts.streamer.isLoggedIn;
            case 4:
              return $scope.hasBoardsLoaded;
          }
          return true;   
        }

        $scope.handleNext = function (forceNext) {
            if ($scope.isLastStep()) {
              $uibModalInstance.close();
            } else {
              switch($scope.step){
                case 0:
                  break;
                case 2:
                case 4:
                  if(!$scope.canGoToNext() && !forceNext) return;
                  break;
              }                
              $scope.step += 1;
            }
        };
        
        $scope.getTooltipText = function() {
          switch($scope.step){
            case 2:
              return "Please sign into your Streamer account.";
            case 4:
              return "A board needs to be added.";
              break;
          }
          return "";   
        }
        
        /*
        * Data import
        */
        $scope.openImportBrowser = function() {
          var registerRequest = {
            type: listenerService.ListenerType.IMPORT_FOLDER,
            runOnce: true,
            publishEvent: true
          }
          listenerService.registerListener(registerRequest, (filepath) => {
            validateUserSettingsFolder(filepath);
          });
        }
        
        $scope.importErrorOccured = false;
        $scope.importErrorMessage = "";
        
        function validateUserSettingsFolder(filePath) {
          // Not the best validation, but it should prevent most mistakes.
          if(!fs.existsSync(filePath) || !filePath.endsWith("user-settings")) {
            $scope.importErrorOccured = true;
            $scope.importErrorMessage = "This is not a valid 'user-settings' folder.";
          }          
          else {
            $rootScope.showSpinner = true;
            copyUserSettingsToUserDataFolder(filePath, () => {
              loadBoardsAndLogins();             
            });
          }
        }
        
        function copyUserSettingsToUserDataFolder(filePath, callback) {
          var source = filePath;
          var destination = dataAccess.getPathInUserData("/user-settings");    
          ncp(source, destination, function (err) {
           if (err) {
             console.log("Failed to copy 'user-settings'!");
             callback();
             return console.error(err);
           }
           console.log('Copied "user-settings" to user data.');
           callback();
          });
        }
        
        function loadBoardsAndLogins() {
          boardService.loadAllBoards().then(() => {  
                    
            connectionService.loadLogin();
            groupsService.loadViewerGroups();
            
            $scope.$applyAsync();
            
            $rootScope.showSpinner = false;
            $scope.setCurrentStep(6);
          });         
        }
        
        $scope.streamerAccount = connectionService.accounts.streamer;
        
        $scope.botAccount = connectionService.accounts.bot;
        
        $scope.loginOrLogout = connectionService.loginOrLogout;
        
        $scope.hasBoardsLoaded = boardService.hasBoardsLoaded();
                
        $scope.firstBoard = {
          id: ""
        }
        
        $scope.boardAddErrorOccured = false;
        
        $scope.selectedBoardName = function() {
          var board = boardService.getSelectedBoard();        
          if(board != null) {
            return board.name;
          }
          return "";
        }
        
        $scope.addBoard = function() {
          var boardId = $scope.firstBoard.id;
          if(boardId == null || boardId.length == 0) {
            return;
          }
          boardService.loadBoardWithId(boardId).then((boards) => {
            var board = boards[0];
            boardService.setSelectedBoard(board);        
            /**
            * Note(ebiggz): This is a workaround to ensure boards load and update scope. 
            * I need to update boardService to use the $q service for Promises instead of regular Promises.
            */
            $q.resolve(true, () => { $scope.hasBoardsLoaded = true });
          },(error) => {
            $q.resolve(true, () => { $scope.boardAddErrorOccured = true; });
            
          });
        }

        $scope.dismiss = function(reason) {
            $uibModalInstance.dismiss(reason);
        };
    });
})();
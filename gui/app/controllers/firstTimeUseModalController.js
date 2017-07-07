(function() {

  //TODO: Rename this to setupWizardModalController
  angular
    .module('firebotApp')
    .controller('firstTimeUseModalController', function ($scope, $uibModalInstance, $q, connectionService, boardService, settingsService) {

        $scope.steps = ['one', 'two', 'three', 'four', 'five', 'six'];
        $scope.stepTitles = ['', 'Get Signed In', 'Sync Controls From Mixer' , 'Your First Board', '', ''];
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
            $scope.step -= ($scope.isFirstStep()) ? 0 : 1;
        };
        
        $scope.showNextButton = function() {
          return !($scope.isFirstStep() || $scope.isLastStep())
        }
        
        $scope.showBackButton = function() {
          return !($scope.isFirstStep() || $scope.isLastStep())
        }
        
        $scope.canGoToNext = function() {
          switch($scope.step){
            case 1:
              return connectionService.accounts.streamer.isLoggedIn;
            case 3:
              return $scope.hasBoardsLoaded;
            case 4:
              return $scope.settingOptions.overlayCompatibility !== "";
          }
          return true;   
        }

        $scope.handleNext = function (forceNext) {
            if ($scope.isLastStep()) {
              console.log(`overlay compat: ${$scope.settingOptions.overlayCompatibility}`);
              settingsService.setOverlayCompatibility($scope.settingOptions.overlayCompatibility);
              $uibModalInstance.close();
            } else {
              switch($scope.step){
                case 0:
                  break;
                case 1:
                case 3:
                  if(!$scope.canGoToNext() && !forceNext) return;
                  break;
              }                
              $scope.step += 1;
            }
        };
        
        $scope.getTooltipText = function() {
          switch($scope.step){
            case 1:
              return "Please sign into your Streamer account.";
            case 3:
              return "A board needs to be added.";
              break;
          }
          return "";   
        }
        
        $scope.settingOptions = {
          overlayCompatibility: ""
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
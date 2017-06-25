(function() {


  angular
    .module('firebotApp')
    .controller('firstTimeUseModalController', function ($scope, $uibModalInstance, connectionService, boardService) {

        $scope.steps = ['one', 'two', 'three', 'four'];
        $scope.stepTitles = ['', 'Get Signed In', 'Your First Board', ''];
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
            return ($scope.isLastStep()) ? 'Okay' : 'Next';
        };

        $scope.handlePrevious = function () {
            $scope.step -= ($scope.isFirstStep()) ? 0 : 1;
        };
        
        $scope.streamerAccount = connectionService.accounts.streamer;
        
        $scope.botAccount = connectionService.accounts.bot;
        
        $scope.loginOrLogout = connectionService.loginOrLogout;
        
        $scope.canGoToNext = function() {
          switch($scope.step){
            case 1:
              return connectionService.accounts.streamer.isLoggedIn;
            case 2:
              return boardService.hasBoardsLoaded();
              break;
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
                case 1:
                case 2:
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
            case 2:
              return "First board needs to be added.";
              break;
          }
          return "";   
        }

        $scope.dismiss = function(reason) {
            $uibModalInstance.dismiss(reason);
        };
    });
})();
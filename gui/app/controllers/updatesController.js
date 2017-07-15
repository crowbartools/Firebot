(function(){
  
 //This handles the Updates tab
 
 angular
   .module('firebotApp')
   .controller('updatesController', function($scope, updatesService, utilityService) {
     
      $scope.getUpdateData = function() {
        return updatesService.updateData;
      }

      // Get update information if we havent alreday
      if(!updatesService.hasCheckedForUpdates) {
        updatesService.checkForUpdate();
      }
      
      $scope.downloadAndInstallUpdate = function() {
        updatesService.downloadAndInstallUpdate();
        $scope.showDownloadModal();
      }
      
      $scope.showDownloadModal = function () {
        var downloadModalContext = {
          templateUrl: "downloadModal.html",
          keyboard: false,
          backdrop: 'static',
          size: 'sm',
          // This is the controller to be used for the modal. 
          controllerFunc: ($scope, $uibModalInstance, $timeout, listenerService) => {
            
            $scope.downloadHasError = false;
            $scope.errorMessage = "";
            
            $scope.downloadComplete = false;
            
            // Update error listener
            var registerRequest = {
              type: listenerService.ListenerType.UPDATE_ERROR,
              runOnce: true
            }        
            listenerService.registerListener(registerRequest, (errorMessage) => {
              // the autoupdater had an error
              $scope.downloadHasError = true;
              $scope.errorMessage = errorMessage;
            });

            // Update downloaded listener
            var updateDownloadedListenerRequest = {
              type: listenerService.ListenerType.UPDATE_DOWNLOADED,
              runOnce: true
            }        
            listenerService.registerListener(updateDownloadedListenerRequest, () => {
              // the autoupdater has downloaded the update and restart shortly
              $scope.downloadComplete = true;
            });
            
            // Start timer for if the download seems to take longer than normal, 
            // we want to allow user to close modal.
            // Currently set to a minute and a half
            $timeout(() => {
              if(!$scope.downloadComplete) {
                $scope.downloadHasError = true;
                $scope.errorMessage = "Download is taking longer than normal. There may have been an error. You can keep waiting or close this and try again later.";
              }
            }, 90*1000);           
            
            $scope.dismiss = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        }      
        utilityService.showModal(downloadModalContext);
      }
   });
 })();
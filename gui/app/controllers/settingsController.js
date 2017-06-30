(function(){
  
 //This handles the Settings tab
 
 angular
   .module('firebotApp')
   .controller('settingsController', function($scope, settingsService, utilityService) {
     
        $scope.settings = settingsService;
        
        $scope.showSetupWizard = utilityService.showSetupWizard;
        
        $scope.currentPort = settingsService.getWebSocketPort();
        
        /**
        * Modals
        */          
        $scope.showChangePortModal = function() {
          var showChangePortModalContext = {
            templateUrl: "changePortModal.html",
            size: "sm",  
            controllerFunc: ($scope, settingsService, $uibModalInstance) => {
              
              $scope.newPort = settingsService.getWebSocketPort();
              
              $scope.newPortError = false;
              
              // When the user clicks a call to action that will close the modal, such as "Save"
              $scope.changePort = function() {
                
                // validate port number
                var newPort = $scope.newPort;
                if(newPort == null 
                  || newPort === '' 
                  || newPort <= 1024 
                  || newPort >= 49151) {
                    
                  $scope.newPortError = true;
                  return;
                }  
                
                // Save port. This will save to both firebot and the overlay.
                settingsService.setWebSocketPort(newPort);
                
                $uibModalInstance.close(newPort);
              };
              
              // When they hit cancel, click the little x, or click outside the modal, we dont want to do anything.
              $scope.dismiss = function() {
                $uibModalInstance.dismiss('cancel');
              };                      
            },
            closeCallback: (port) => {
                // Update the local port scope var so setting input updates
                $scope.currentPort = port;         
            }
          }    
          utilityService.showModal(showChangePortModalContext);
        }
        
   });
 })();
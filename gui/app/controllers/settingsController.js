(function(){
  
 //This handles the Settings tab
 
 angular
   .module('firebotApp')
   .controller('settingsController', function($scope, $timeout, settingsService, 
     utilityService, listenerService) {
     
        $scope.settings = settingsService;
        
        $scope.showSetupWizard = utilityService.showSetupWizard;
        
        $scope.openRootFolder = function() {
          listenerService.fireEvent(listenerService.EventType.OPEN_ROOT);
        }

        /* back ups */
        $scope.openBackupFolder = function() {
          listenerService.fireEvent(listenerService.EventType.OPEN_BACKUP);
        }        

        $scope.startBackup = function() {
          $scope.isBackingUp = true;
          $scope.backupCompleted = false;
          listenerService.fireEvent(listenerService.EventType.INITIATE_BACKUP, true);
        }
        
        listenerService.registerListener(
          { type: listenerService.ListenerType.BACKUP_COMPLETE }, 
          function(manualActivation) {
            $scope.isBackingUp = false;
            
            if(manualActivation) {
              // we only want to act if the backup was manually triggered
              $scope.backupCompleted = true;
              // after 5 seconds, hide the completed message
              $timeout(() => { 
                if($scope.backupCompleted) {
                  $scope.backupCompleted = false 
                }
              }, 5000);
            }      
          });              

        $scope.autoUpdateSlider = {
          value: settingsService.getAutoUpdateLevel(),
          options: {
            showSelectionBar: true,
            showTicks: true,
            showTicksValues: true,
            stepsArray: [
              {value: 2},
              {value: 3},
              {value: 4}
            ],
            translate: function (value, sliderId, label) {
              return $scope.getAutoUpdateLevelString(value);
            },
            ticksTooltip: function (index) {
              switch(index) {
                case 0:
                  return "Updates that fix bugs or add features. (Example: v1.0 to v1.1.1)";
                case 1:
                  return "Updates that are major new versions. Could contain breaking changes. (Example: v1.0 to v2.0)"
                case 2:
                  return "Any beta updates. Might have bugs! (Example: v1.0 to v2.0-beta)";
                default:
                  return "";
              }
            },
            getSelectionBarColor: function(value) {
                return "orange";
            },
            getPointerColor: function(value) {
                return "orange";
            },
            onChange: function(id) {
              settingsService.setAutoUpdateLevel($scope.autoUpdateSlider.value);
            }
          }        
        };
            
        $scope.getAutoUpdateLevelString = function(level) {
          switch(level) {
            case 0:
              return "Off";
            case 2:
              return "Default";
            case 3:
              return "Major Versions"
            case 4:
              return "Betas";
            default:
              return "";
          }
        }
        
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
        
        $scope.showEditOverlayInstancesModal = function() {
          var showEditOverlayInstancesModalContext = {
            templateUrl: "editOverlayInstances.html",  
            controllerFunc: ($scope, settingsService, utilityService, $uibModalInstance) => {
              
              $scope.getOverlayInstances = function() {
                return settingsService.getOverlayInstances();
              };
              
              $scope.usingObs = settingsService.getOverlayCompatibility() == 'OBS';
              
              $scope.deleteOverlayInstanceAtIndex = function(index) {
                var instances = settingsService.getOverlayInstances();
                
                instances.splice(index, 1);
                
                settingsService.setOverlayInstances(instances);
              };
              
              var addOverlayInstance = function(overlayInstance) {
                var instances = settingsService.getOverlayInstances();
                
                instances.push(overlayInstance);
                
                settingsService.setOverlayInstances(instances);
              };
              
              $scope.showViewUrlModal = function(instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
              }            
              
              $scope.showCreateInstanceModal = function() {
                var showCreateInstanceModalContext = {
                  templateUrl: "createOverlayInstance.html",
                  size: "sm",   
                  controllerFunc: ($scope, settingsService, $uibModalInstance) => {
                    
                    $scope.name = "";
                    
                    $scope.create = function() {
                      
                      if(settingsService.getOverlayInstances().includes($scope.name) ||
                          $scope.name == "") {
                        $scope.createError = true;
                        return;
                      }
                      
                      $uibModalInstance.close($scope.name);
                    }
                                  
                    $scope.dismiss = function() {
                      $uibModalInstance.dismiss('cancel');
                    };                      
                  },
                  closeCallback: (instanceName) => {
                      addOverlayInstance(instanceName);         
                  }                  
                }    
                utilityService.showModal(showCreateInstanceModalContext);
              }
              
                            
              $scope.dismiss = function() {
                $uibModalInstance.dismiss('cancel');
              };                      
            }
          }    
          utilityService.showModal(showEditOverlayInstancesModalContext);
        }
        
   });
 })();
(function(){
  
 const _ = require('underscore')._;
   
 angular
   .module('firebotApp')
   .controller('editBoardSettingsModalController', function($scope, $uibModalInstance, utilityService, boardService, board) {
     
     $scope.board = board;
     
     $scope.getScenesForBoard = function() {
       var scenes = [];
       if (board != null) {
         scenes = Object.keys(board.scenes);
       }
       return scenes;
     };
     
     $scope.getViewerGroupSettingsForScene = function(scene) {
       var settings = [];
       if (board != null) {
         settings = board.scenes[scene].default;
       }
       return settings;
     }
     
     $scope.getCooldownGroupSettings = function() {
       var settings = [];
       if (board != null) {
         settings = _.values(board.cooldownGroups);
       }
       return settings;
     }
     
     $scope.close = function() {
       $uibModalInstance.close();
     };
     
     $scope.dismiss = function() {
       $uibModalInstance.dismiss();
     };
     
     /*
     * EDIT VIEWER GROUP MODAL
     */
     $scope.showEditViewerGroupDefaultsModal = function(sceneName) {
       var editViewerGroupDefaultsModalContext = {
         templateUrl: "./templates/interactive/modals/editViewerGroupModal.html",
         // This is the controller to be used for the modal. 
         controllerFunc: ($scope, $uibModalInstance, utilityService, groupsService, scene) => {

           $scope.scene = scene;
           
           $scope.groups = groupsService;          
           
           function getGroupList() {
             var groups = [];
             
             var inactiveGroups = groupsService.getInactiveGroups();  
             var combinedGroups = inactiveGroups.concat(scene.default.filter((e) => { return e !== 'None' } ));           
             
             // Filter out duplicates
             combinedGroups = combinedGroups.filter(function(elem, pos) {
                 return combinedGroups.indexOf(elem) == pos;
             });
             
             return combinedGroups;
           }    
           
           $scope.groupList = getGroupList();        
           
           $scope.saveChanges = function() {
             $uibModalInstance.close();

              // Refresh the interactive control cache.
              ipcRenderer.send('refreshInteractiveCache');
           };
           
           $scope.updateCheckedArrayWithElement = function(array, element) {
             // Remove "None"
             // Later on this can be removed and replaced with a "uncheck all" button in the UI.
             // But for now this will help convert files over to not use "None" anymore.
             var index = array.indexOf("None");
             if (index !== -1) {
                array.splice(index, 1);
             }

             // Update array
             $scope.scene.default = utilityService.getNewArrayWithToggledElement(array, element);
           }

           // This wipes out all checked items. This is a lame "uncheck all button".
           // We can remove this later and replace with an actual uncheck all button after a few versions.
           $scope.clearSavedArray = function(){
             $scope.scene.default = ["None"];
           }
                
           $scope.arrayContainsElement = utilityService.arrayContainsElement;
           
           $scope.save = function() {
             $uibModalInstance.close($scope.scene);

             // Refresh the interactive control cache.
             ipcRenderer.send('refreshInteractiveCache');
           };   
           
           // When they hit cancel or click outside the modal, we dont want to do anything
           $scope.dismiss = function() {
             $uibModalInstance.dismiss('cancel');
           };
         },
         closeCallback: (scene) => {
           boardService.saveSceneForCurrentBoard(scene);
         },
         resolveObj: {
           scene: () => {
             return $.extend(true, {}, board.scenes[sceneName]);;
           }
         }
       }      
       utilityService.showModal(editViewerGroupDefaultsModalContext);
     };
     
     /*
     * ADD OR EDIT COOLDOWN GROUP MODAL
     */
     $scope.showAddOrEditCooldownGroupModal = function(cooldownGroup) {
       var editViewerGroupDefaultsModalContext = {
         templateUrl: "./templates/interactive/modals/addOrEditCooldownGroupModal.html",
         // This is the controller to be used for the modal. 
         controllerFunc: ($scope, $uibModalInstance, boardService, utilityService, cooldownGroup) => {

           $scope.cooldownGroup = {};
           
           $scope.isNewGroup = true;
      
           
           if(cooldownGroup != null) {
             $scope.cooldownGroup = cooldownGroup;
             $scope.isNewGroup = false;
           }
           
           $scope.allControlIds = boardService.getControlIdsForSelectedBoard();                  
          
           $scope.updateCheckedArrayWithElement = function(array, element) {
             $scope.cooldownGroup.buttons = utilityService.getNewArrayWithToggledElement(array, element);
           }
           
           $scope.arrayContainsElement = utilityService.arrayContainsElement;
           
           $scope.save = function() {
             if($scope.cooldownGroup.groupName != null && $scope.cooldownGroup.groupName != "") {
                $uibModalInstance.close({ shouldDelete: false, newCooldownGroup: $scope.cooldownGroup });

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');
             }
           };
           
           $scope.delete = function() {
             $uibModalInstance.close({ shouldDelete: true });
           };   
           
           // When they hit cancel or click outside the modal, we dont want to do anything
           $scope.dismiss = function() {
             $uibModalInstance.dismiss('cancel');
           };
         },
         closeCallback: (response) => {
           var previousName = "";
           if(cooldownGroup != null) {
             previousName = cooldownGroup.groupName;
           }
           
           if(response.shouldDelete) {
             boardService.deleteCooldownGroupForCurrentBoard(previousName, cooldownGroup);
           } else {
             boardService.saveCooldownGroupForCurrentBoard(previousName, response.newCooldownGroup);
           }     

            // Refresh the interactive control cache.
            ipcRenderer.send('refreshInteractiveCache'); 
         },
         resolveObj: {
           cooldownGroup: () => {
             if(cooldownGroup == null) {
               return null;
             } else {
               return $.extend(true, {}, cooldownGroup);
             }
           }
         }
       }      
       utilityService.showModal(editViewerGroupDefaultsModalContext);
     };          
   });
 })();
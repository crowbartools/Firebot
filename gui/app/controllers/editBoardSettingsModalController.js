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
           
           $scope.defaultGroups = [
             "Pro",
             "Subscribers",
             "Moderators",
             "Staff"
           ];            
           
           $scope.saveChanges = function() {
             $uibModalInstance.close();
           };
           
           $scope.updateCheckedArrayWithElement = function(array, element) {
             $scope.scene.default = utilityService.getNewArrayWithToggledElement(array, element);
           }  
                
           $scope.arrayContainsElement = utilityService.arrayContainsElement;
           
           $scope.save = function() {
             $uibModalInstance.close($scope.scene);
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
           console.log(response.newCooldownGroup);
           if(response.shouldDelete) {
             boardService.deleteCooldownGroupForCurrentBoard(previousName);
           } else {
             boardService.saveCooldownGroupForCurrentBoard(previousName, response.newCooldownGroup);
           }           
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
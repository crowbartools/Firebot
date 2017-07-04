(function(){
  
 // This contains utility functions
 // Just inject "utilityService" into any controller that you want access to these
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('utilityService', function ($rootScope, $uibModal, listenerService) {
    var service = {};
      
    service.showModal = function(showModalContext) {

      // We dont want to do anything if there's no context
      if (showModalContext == null) {
        console.log("showModal() was called but no context was provided!");
        return;
      }

      // Pull values out of the context
      var templateUrl = showModalContext.templateUrl;
      var controllerFunc = showModalContext.controllerFunc;
      var resolveObj = showModalContext.resolveObj;
      var closeCallback = showModalContext.closeCallback;
      var dismissCallback = showModalContext.dismissCallback;

      // Show the modal
      var modalInstance = $uibModal.open({
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: templateUrl,
        controller: controllerFunc,
        resolve: resolveObj,
        size: showModalContext.size,
        keyboard: showModalContext.keyboard,
        backdrop: showModalContext.backdrop? showModalContext.backdrop : true
      });

      // If no callbacks were defined, create blank ones. This avoids a console error 
      if (typeof closeCallback !== "function") {
        closeCallback = () => {};
      }
      if (typeof dismissCallback !== "function") {
        dismissCallback = () => {};
      }
      
      // Handle when the modal is exited
      modalInstance.result.then(closeCallback, dismissCallback);
    }
    
    /*
    * FIRST TIME USE MODAL
    */
    service.showSetupWizard = function() {
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
      service.showModal(firstTimeUseModalContext);
    };
    
    service.showErrorModal = function (errorMessage) {
      $rootScope.showSpinner = false;
      var errorModalContext = {
        templateUrl: "errorModal.html",
        // This is the controller to be used for the modal. 
        controllerFunc: ($scope, $uibModalInstance, message) => {
          
          $scope.message = message;
          
          $scope.close = function() {
            $uibModalInstance.close();
          };
          
          $scope.dismiss = function() {
            $uibModalInstance.dismiss('cancel');
          };
        },
        resolveObj: {
          message: () => {
            return errorMessage;
          }
        }
      }      
      service.showModal(errorModalContext);
    }
    
    // This is used by effects that make use of lists of checkboxes. Returns and array of selected boxes.
    service.getNewArrayWithToggledElement = function (array, element){
        var itemArray = [];
        if(array != null){
          itemArray = array;
        }             
        
        var itemIndex = -1;
        try{
          var itemIndex = itemArray.indexOf(element);
        } catch(err){
          
        }

        if(itemIndex != -1){
          // Item exists, so we're unchecking it.
          itemArray.splice(itemIndex, 1);
        } else {
          // Item doesn't exist! Add it in.
          itemArray.push(element);
        }

        // Set new scope var.
        return itemArray;
    }

    // This is used to check for an item in a saved array and returns true if it exists.
    service.arrayContainsElement = function(array, element){
      if(array != null) {
        return array.indexOf(element) != -1;
      } else {
        return false;
      }              
    }
    
    
    // Watches for an event from main process    
    listenerService.registerListener(
      { type: listenerService.ListenerType.ERROR }, 
      (errorMessage) => {
        service.showErrorModal(errorMessage);
      });
    
    
    return service;
  });
})();
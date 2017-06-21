(function(){
  
 // This contains utility functions
 // Just inject "utilityService" into any controller that you want access to these
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('utilityService', function ($uibModal) {
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
        resolve: resolveObj
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
    
    function showErrorModal(errorMessage) {
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
    
    // Watches for an error event from main process
    ipcRenderer.on('error', function (event, errorMessage){
        showErrorModal(errorMessage);
    })
    
    return service;
  });
})();
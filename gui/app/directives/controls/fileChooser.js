(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 
 angular
   .module('firebotApp')
   .component("fileChooser", {
       bindings: {
        model: "=", 
        onUpdate: '&'
      },
       template: `
       <div class="input-group">
         <span class="input-group-btn">
         <button 
           class="btn btn-default show-image-effect-chooser" 
           type="button"
           ng-click="$ctrl.openFileExporer()">Choose</button>
         </span>
         <input type="text" class="form-control show-image-effect-input" ng-model="$ctrl.model">
       </div>
       `,
       controller: function($scope, $element, $attrs, listenerService) {
         var ctrl = this;       
         ctrl.openFileExporer = function() {
           var registerRequest = {
             type: listenerService.ListenerType.IMAGE_FILE,
             runOnce: true,
             publishEvent: true
           }
           listenerService.registerListener(registerRequest, (filepath) => {
             ctrl.model = filepath;
             ctrl.onUpdate({filepath: filepath});
           });
         };
       }   
     });     
 })();
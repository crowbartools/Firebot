(function(){
  
 //This adds the <eos-overlay-instance> element
 
 angular
   .module('firebotApp')
   .component("eosOverlayInstance", {
       bindings: {
        effect: '='
      },
      template: `
       <div class="effect-setting-container" ng-if="$ctrl.settings.useOverlayInstances()">
         <div class="effect-specific-title"><h4>Overlay Instance</h4></div>
         <div class="btn-group">
             <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                 <span class="chat-effect-type">{{$ctrl.effect.overlayInstance ? $ctrl.effect.overlayInstance : 'Default'}}</span> <span class="caret"></span>
             </button>
             <ul class="dropdown-menu chat-effect-dropdown">
                 <li ng-click="$ctrl.effect.overlayInstance = null"><a href>Default</a></li>
                 <li ng-repeat="instanceName in $ctrl.settings.getOverlayInstances()" ng-click="$ctrl.effect.overlayInstance = instanceName"><a href>{{instanceName}}</a></li>
             </ul>
         </div>
       </div>
       `,
       controller: function($scope, $element, $attrs, settingsService) {
         var ctrl = this;
         
         ctrl.settings = settingsService;
         
         ctrl.$onInit = function() {
           
           // Reset overlay instance to default (or null) if the saved instance doesnt exist anymore
           if(ctrl.effect.overlayInstance != null) {
              if(!settingsService.getOverlayInstances().includes(ctrl.effect.overlayInstance)) {
                ctrl.effect.overlayInstance = null;
              }
           }
        };
       }   
     });   
 })();
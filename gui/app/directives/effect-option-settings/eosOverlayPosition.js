(function(){
  
 //This adds the <eos-overlay-instance> element
 
 angular
   .module('firebotApp')
   .component("eosOverlayPosition", {
       bindings: {
        effect: '='
      },
      template: `
      <div class="effect-setting-container">
         <div class="effect-specific-title">
             <h4>What location should it show in?</h4>
         </div>
         <dropdown-select options="$ctrl.positions" selected="$ctrl.effect.position"></dropdown-select>
         <div ng-if="$ctrl.effect.position == 'Custom'" style="margin: 15px 0 15px 15px;">
           <form class="form-inline">
               <div class="form-group">
                   <input type="number" class="form-control" ng-model="$ctrl.topOrBottomValue" ng-change="$ctrl.updateAllValues()" style="width: 85px;">
               </div>
               <div class="form-group">
                   <span> pixels from the </span>
                   <dropdown-select options="['top','bottom']" selected="$ctrl.topOrBottom" on-update="$ctrl.updateTopOrBottom(option)"></dropdown-select>
               </div>
               <div style="margin-top: 15px;">
                   <div class="form-group">
                       <input type="number" class="form-control" ng-model="$ctrl.leftOrRightValue" ng-change="$ctrl.updateAllValues()" style="width: 85px;">
                   </div>
                   <div class="form-group">
                       <span> pixels from the </span>
                       <dropdown-select options="['left','right']" selected="$ctrl.leftOrRight" on-update="$ctrl.updateLeftOrRight(option)"></dropdown-select>
                   </div>
               </div>
           </form>
         </div>
      </div>
       `,
       controller: function($scope, $element, $attrs) {
         var ctrl = this;
         
         ctrl.topOrBottom = "top";
         ctrl.topOrBottomValue = 0;        
         ctrl.leftOrRight = "left";
         ctrl.leftOrRightValue = 0;
         
         ctrl.updateTopOrBottom = function(option) {
          ctrl.topOrBottom = option;
          ctrl.updateAllValues();
         }
         
         ctrl.updateLeftOrRight = function(option) {
          ctrl.leftOrRight = option;
          ctrl.updateAllValues();
         }          
         
         ctrl.updateAllValues = function() {
           if(ctrl.topOrBottom == 'top') {
             ctrl.effect.customCoords.top = ctrl.topOrBottomValue;
             ctrl.effect.customCoords.bottom = null;
           } else {
             ctrl.effect.customCoords.top = null;
             ctrl.effect.customCoords.bottom = ctrl.topOrBottomValue;
           }
           
           if(ctrl.leftOrRight == 'left') {
             ctrl.effect.customCoords.left = ctrl.leftOrRightValue;
             ctrl.effect.customCoords.right = null;
           } else {
             ctrl.effect.customCoords.left = null;
             ctrl.effect.customCoords.right = ctrl.leftOrRightValue;
           }
         }      
         
         ctrl.positions = [
           "Custom",
           "Top Left",
           "Top Middle",
           "Top Right",
           "Middle Left",
           "Middle",
           "Middle Right",
           "Bottom Left",
           "Bottom Middle",
           "Bottom Right"
         ]
                
         ctrl.$onInit = function() {           
           if(ctrl.effect.position == null) {
              ctrl.effect.position = "Middle";
           }
           if(ctrl.effect.customCoords == null) {
             ctrl.effect.customCoords = {
               top: 0,
               bottom: null,
               left: 0,
               right: null
             };
           } else {
             if(ctrl.effect.customCoords.top != null) {
               ctrl.topOrBottom = "top";
               ctrl.topOrBottomValue = ctrl.effect.customCoords.top;        
             } else {
               ctrl.topOrBottom = "bottom";
               ctrl.topOrBottomValue = ctrl.effect.customCoords.bottom; 
             }
             if(ctrl.effect.customCoords.left != null) {
               ctrl.leftOrRight = "left";
               ctrl.leftOrRightValue = ctrl.effect.customCoords.left;
             } else {
               ctrl.leftOrRight = "right";
               ctrl.leftOrRightValue = ctrl.effect.customCoords.right;
             }
           }
        };
       }   
     });   
 })();
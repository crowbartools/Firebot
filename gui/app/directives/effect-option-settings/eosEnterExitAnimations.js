(function(){
  
 //This adds the <eos-enter-exit-animations> element
 
 angular
   .module('firebotApp')
   .component("eosEnterExitAnimations", {
       bindings: {
        effect: '=',
        limitTo: '@'
      },
      template: `
       <div class="effect-setting-container">
         <div class="effect-specific-title"><h4>{{$ctrl.limitTo ? $ctrl.limitTo + ' Animation' : 'Enter/Exit Animations'}}</h4></div>
         <div class="input-group" style="width: 100%" ng-hide="$ctrl.limitTo == 'Exit'">
            <div class="fb-control-detail" ng-hide="$ctrl.limitTo != null">ENTER</div>
            <select class="fb-select" ng-model="$ctrl.selected.enter" ng-change="$ctrl.enterUpdate()" ng-options="enter.name group by enter.category for enter in $ctrl.animations.enter"></select>
         </div>
         <div class="input-group" style="width: 100%" ng-hide="$ctrl.limitTo == 'Enter'">
            <div class="fb-control-detail" ng-hide="$ctrl.limitTo != null">EXIT</div>
            <select class="fb-select" ng-model="$ctrl.selected.exit" ng-change="$ctrl.exitUpdate()" ng-options="exit.name group by exit.category for exit in $ctrl.animations.exit"></select>
         </div>
       </div>
       `,
       controller: function($scope, $element, $attrs) {
         var ctrl = this;
         ctrl.selected = {
           enter: null,
           exit: null
         }
         
         ctrl.animations = {
           enter: [
             {
               name: "Bounce In",
               class: "bounceIn",
               category: "Bouncing"
             },
             {
               name: "Bounce In Up",
               class: "bounceInUp",
               category: "Bouncing"
             },
             {
               name: "Bounce In Down",
               class: "bounceInDown",
               category: "Bouncing"
             },
             {
               name: "Bounce In Left",
               class: "bounceInLeft",
               category: "Bouncing"
             },
             {
               name: "Bounce In Right",
               class: "bounceInRight",
               category: "Bouncing"
             },             
             {
               name: "Fade In",
               class: "fadeIn",
               category: "Fade"
             },
             {
               name: "Fade In Down",
               class: "fadeInDown",
               category: "Fade"
             },
             {
               name: "Fade In Down Big",
               class: "fadeInDownBig",
               category: "Fade"
             },
             {
               name: "Fade In Up",
               class: "fadeInUp",
               category: "Fade"
             },
             {
               name: "Fade In Up Big",
               class: "fadeInUpBig",
               category: "Fade"
             },
             {
               name: "Fade In Left",
               class: "fadeInLeft",
               category: "Fade"
             },
             {
               name: "Fade In Left Big",
               class: "fadeInLeftBig",
               category: "Fade"
             },
             {
               name: "Fade In Right",
               class: "fadeInRight",
               category: "Fade"
             },
             {
               name: "Fade In Right Big",
               class: "fadeInRightBig",
               category: "Fade"
             },
             {
               name: "Flip In X",
               class: "flipInX",
               category: "Flip"
             },
             {
               name: "Flip In Y",
               class: "flipInY",
               category: "Flip"
             },
             {
              	name: "Rotate In",
              	class: "rotateIn",
              	category: "Rotate"
              }, {
              	name: "Rotate In Down Left",
              	class: "rotateInDownLeft",
              	category: "Rotate"
              }, {
              	name: "Rotate In Down Right",
              	class: "rotateInDownRight",
              	category: "Rotate"
              }, {
              	name: "Rotate In Up Left",
              	class: "rotateInUpLeft",
              	category: "Rotate"
              }, {
              	name: "Rotate In Up Right",
              	class: "rotateInUpRight",
              	category: "Rotate"
              },
              {
              	name: "Zoom In",
              	class: "zoomIn",
              	category: "Zoom"
              }, {
              	name: "Zoom In Down",
              	class: "zoomInDown",
              	category: "Zoom"
              }, {
              	name: "Zoom In Left",
              	class: "zoomInLeft",
              	category: "Zoom"
              }, {
              	name: "Zoom In Right",
              	class: "zoomInRight",
              	category: "Zoom"
              }, {
              	name: "Zoom In Up",
              	class: "zoomInUp",
              	category: "Zoom"
              },
              {
              	name: "Slide In Down",
              	class: "slideInDown",
              	category: "Slide"
              }, {
              	name: "Slide In Left",
              	class: "slideInLeft",
              	category: "Slide"
              }, {
              	name: "Slide In Right",
              	class: "slideInRight",
              	category: "Slide"
              }, {
              	name: "Slide In Up",
              	class: "slideInUp",
              	category: "Slide"
              },              
              {
              	name: "Light Speed In",
              	class: "lightSpeedIn",
              	category: "Misc"
              },
              {
              	name: "Jack In The Box",
              	class: "jackInTheBox",
              	category: "Misc"
              },
              {
              	name: "Roll In",
              	class: "rollIn",
              	category: "Misc"
              }
           ],
           exit: [
             {
               name: "Bounce Out",
               class: "bounceOut",
               category: "Bouncing"
             },
             {
               name: "Bounce Out Up",
               class: "bounceOutUp",
               category: "Bouncing"
             },
             {
               name: "Bounce Out Down",
               class: "bounceOutDown",
               category: "Bouncing"
             },
             {
               name: "Bounce Out Left",
               class: "bounceOutLeft",
               category: "Bouncing"
             },
             {
               name: "Bounce Out Right",
               class: "bounceOutRight",
               category: "Bouncing"
             },             
             {
               name: "Fade Out",
               class: "fadeOut",
               category: "Fade"
             },
             {
               name: "Fade Out Down",
               class: "fadeOutDown",
               category: "Fade"
             },
             {
               name: "Fade Out Down Big",
               class: "fadeOutDownBig",
               category: "Fade"
             },
             {
               name: "Fade Out Up",
               class: "fadeOutUp",
               category: "Fade"
             },
             {
               name: "Fade Out Up Big",
               class: "fadeOutUpBig",
               category: "Fade"
             },
             {
               name: "Fade Out Left",
               class: "fadeOutLeft",
               category: "Fade"
             },
             {
               name: "Fade Out Left Big",
               class: "fadeOutLeftBig",
               category: "Fade"
             },
             {
               name: "Fade Out Right",
               class: "fadeOutRight",
               category: "Fade"
             },
             {
               name: "Fade Out Right Big",
               class: "fadeOutRightBig",
               category: "Fade"
             },
             {
              	name: "Rotate Out",
              	class: "rotateOut",
              	category: "Rotate"
              }, {
              	name: "Rotate Out Down Left",
              	class: "rotateOutDownLeft",
              	category: "Rotate"
              }, {
              	name: "Rotate Out Down Right",
              	class: "rotateOutDownRight",
              	category: "Rotate"
              }, {
              	name: "Rotate Out Up Left",
              	class: "rotateOutUpLeft",
              	category: "Rotate"
              }, {
              	name: "Rotate Out Up Right",
              	class: "rotateOutUpRight",
              	category: "Rotate"
              },
              {
              	name: "Zoom Out",
              	class: "zoomOut",
              	category: "Zoom"
              }, {
              	name: "Zoom Out Down",
              	class: "zoomOutDown",
              	category: "Zoom"
              }, {
              	name: "Zoom Out Left",
              	class: "zoomOutLeft",
              	category: "Zoom"
              }, {
              	name: "Zoom Out Right",
              	class: "zoomOutRight",
              	category: "Zoom"
              }, {
              	name: "Zoom Out Up",
              	class: "zoomOutUp",
              	category: "Zoom"
              },
              {
              	name: "Slide Out Down",
              	class: "slideOutDown",
              	category: "Slide"
              }, {
              	name: "Slide Out Left",
              	class: "slideOutLeft",
              	category: "Slide"
              }, {
              	name: "Slide Out Right",
              	class: "slideOutRight",
              	category: "Slide"
              }, {
              	name: "Slide Out Up",
              	class: "slideOutUp",
              	category: "Slide"
              },             
             {
              	name: "Light Speed Out",
              	class: "lightSpeedOut",
              	category: "Misc"
              },
              {
              	name: "Hinge",
              	class: "hinge",
              	category: "Misc"
              },
              {
              	name: "Roll Out",
              	class: "rollOut",
              	category: "Misc"
              }
           ]
         }
         
         ctrl.$onInit = function() {
           
           ctrl.effect.enterAnimation = ctrl.effect.enterAnimation ? ctrl.effect.enterAnimation : 'fadeIn';
           ctrl.selected.enter = ctrl.animations.enter.filter((ani) => {
             return ani.class === ctrl.effect.enterAnimation;
           })[0];
           
           ctrl.effect.exitAnimation = ctrl.effect.exitAnimation ? ctrl.effect.exitAnimation : 'fadeOut';
           ctrl.selected.exit = ctrl.animations.exit.filter((ani) => {
             return ani.class === ctrl.effect.exitAnimation;
           })[0];
        };
         
         
         ctrl.enterUpdate = function() {
           ctrl.effect.enterAnimation = ctrl.selected.enter.class;
         }
         ctrl.exitUpdate = function(option) {
           ctrl.effect.exitAnimation = ctrl.selected.exit.class;
         }
       }   
     });   
 })();
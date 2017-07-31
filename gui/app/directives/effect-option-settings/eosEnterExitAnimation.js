(function(){
  
 //This adds the <eos-enter-exit-animations> element
 
 angular
   .module('firebotApp')
   .component("eosEnterExitAnimations", function() {
     return {
       scope: {
         effect: '='
       },
       template: `
       <div class="effect-setting-container">
         <div class="effect-specific-title"><h4>Enter/Exit Animations</h4></div>
         <div class="input-group">
            <span class="input-group-addon">Enter</span>
            <div class="btn-group" uib-dropdown>
              <button id="single-button" type="button" class="btn btn-primary" uib-dropdown-toggle>
                Button dropdown <span class="caret"></span>
              </button>
              <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="enterAni in animations.enter"><a href>{{enterAni}}</a></li>
              </ul>
            </div>
         </div>
         <div class="input-group">
            <span class="input-group-addon">Exit</span>
            <div class="btn-group" uib-dropdown>
              <button id="single-button" type="button" class="btn btn-primary" uib-dropdown-toggle>
                Button dropdown <span class="caret"></span>
              </button>
              <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                <li role="menuitem" ng-repeat="exitAni in animations.exit"><a href>{{exitAni}}</a></li>
              </ul>
            </div>
         </div>
       </div>
       `,
       controller: ($scope) => {
         $scope.animations = {
           enter: [],
           exit: []
         }
       }   
     }
   });
 })();
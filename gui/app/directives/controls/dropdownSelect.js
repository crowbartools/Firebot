(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 
 angular
   .module('firebotApp')
   .component("dropdownSelect", {
       bindings: {
        options: "=",
        selected: "=", 
        onUpdate: '&'
      },
       template: `
       <div class="btn-group" uib-dropdown>
         <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
           {{$ctrl.selected}} <span class="caret"></span>
         </button>
         <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
           <li role="menuitem" ng-repeat="option in $ctrl.options" ng-click="$ctrl.selectOption(option)"><a href>{{option}}</a></li>
         </ul>
       </div>
       `,
       controller: function($scope, $element, $attrs) {
         var ctrl = this;
         ctrl.selectOption = function(option) {
           ctrl.selected = option;
           ctrl.onUpdate({option: option});
         }
       }   
     });     
 })();
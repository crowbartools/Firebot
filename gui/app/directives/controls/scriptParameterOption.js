(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 
 angular
   .module('firebotApp')
   .component("scriptParameterOption", {
       bindings: {
        metadata: "=",
        name: "<", 
        onUpdate: '&'
      },
       template: `
       <div ng-switch="$ctrl.metadata.type" style="padding-bottom: 10px;">
          <div style="font-size: 15px;font-weight: 400;">{{$ctrl.metadata.type != 'boolean' ? $ctrl.metadata.description ? $ctrl.metadata.description : $ctrl.name : ""}}</div>
          <div ng-switch-when="string">
            <input class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.metadata.value">
          </div>
          <div ng-switch-when="number">
            <input class="form-control" type="number" placeholder="Enter a number" ng-model="$ctrl.metadata.value">
          </div>
          <div ng-switch-when="boolean" style="padding-top:10px;">
            <label class="control-fb control--checkbox"> {{$ctrl.metadata.description ? $ctrl.metadata.description : $ctrl.name}}
              <input type="checkbox" ng-click="$ctrl.metadata.value = !$ctrl.metadata.value" ng-checked="$ctrl.metadata.value" aria-label="...">
              <div class="control__indicator"></div>
            </label>
          </div>
          <div ng-switch-when="enum">
            <dropdown-select options="$ctrl.metadata.options" selected="$ctrl.metadata.value"></dropdown-select>
          </div>
          <div ng-switch-when="filepath">
            <file-chooser model="$ctrl.metadata.value"></file-chooser>
          </div>
       </div>
       `,
       controller: function($scope, $element, $attrs) {
         var ctrl = this;
         
         //If there is no value, supply the default.
         ctrl.$onInit = function() {
           if(ctrl.metadata.value == null) {
             ctrl.metadata.value = ctrl.metadata.default;
           }
         }
       }   
     });     
 })();
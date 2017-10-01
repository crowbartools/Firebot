(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 const Effect = require('../../lib/interactive/EffectType.js');
 
 angular
   .module('firebotApp')
   .component("searchableEffectDropdown", {
       bindings: {
        trigger: "@",
        selected: "=", 
        onUpdate: '&'
      },
      template: `
      <ui-select ng-model="$ctrl.selectedEffect" on-select="$ctrl.selectOption($item, $model)" theme="bootstrap">
        <ui-select-match placeholder="Select or search for an effect... ">{{$select.selected.name}}</ui-select-match>
        <ui-select-choices repeat="option in $ctrl.options | filter: { name: $select.search }" style="position:relative;">
          <div ng-bind-html="option.name | highlight: $select.search"></div>
          <small class="muted">{{option.description}}</small>
          
          <!--still working on this-->
          <!--<span class="muted" style="position: absolute;top: 6px;right: 6px;font-size: 12px;" uib-tooltip-html="'<b>Dependencies:</b><br /> ' + option.dependencies.join()" tooltip-append-to-body="true"><i class="fal fa-link"></i></span>-->
          
        </ui-select-choices>
      </ui-select>
      `,
      controller: function($scope, $element, $attrs) {
        var ctrl = this;
        
        // If there is no value, supply the default.
        ctrl.$onInit = function() {
          ctrl.options = Effect.getEffectDefinitions(ctrl.trigger);
               
          var selected = ctrl.options.filter((e) => e.name == ctrl.selected);  
  
          if(selected.length > 0) {
            ctrl.selectedEffect = selected[0];
          }
        }
        
        ctrl.selectOption = function(option) {
          ctrl.selected = option.name;
          ctrl.onUpdate({option: option});
        }
      }   
    });     
 })();
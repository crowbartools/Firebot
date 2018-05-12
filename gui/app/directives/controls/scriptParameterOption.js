'use strict';
(function() {

    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module('firebotApp')
        .component("scriptParameterOption", {
            bindings: {
                metadata: "=",
                name: "<",
                onUpdate: '&',
                trigger: "@",
                modalId: "@"
            },
            template: `
       <div ng-switch="$ctrl.metadata.type" style="padding-bottom: 10px;font-size: 15px;font-weight: 600;">
          <div>{{$ctrl.metadata.type != 'boolean' ? $ctrl.metadata.description ? $ctrl.metadata.description : $ctrl.name : ""}}</div>
          <div ng-if="$ctrl.metadata.type != 'boolean' && $ctrl.metadata.secondaryDescription" style="padding-bottom: 5px;font-size: 14px;font-weight: 300;">{{$ctrl.metadata.secondaryDescription}}</div>
          <div ng-switch-when="string">
            <textarea ng-if="$ctrl.metadata.useTextArea" ng-model="$ctrl.metadata.value" class="form-control" placeholder="Enter text" rows="5" style="width:100%"></textarea>
            <input ng-if="!$ctrl.metadata.useTextArea" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.metadata.value">
          </div>
          <div ng-switch-when="password">
            <input class="form-control" type="password" placeholder="********" ng-model="$ctrl.metadata.value">
          </div>
          <div>
          </div>
          <div ng-switch-when="number">
            <input class="form-control" type="number" placeholder="Enter a number" ng-model="$ctrl.metadata.value">
          </div>
          <div ng-switch-when="boolean" style="padding-top:10px;">
            <label class="control-fb control--checkbox" style="font-weight: 600;"> {{$ctrl.metadata.description ? $ctrl.metadata.description : $ctrl.name}}
              <input type="checkbox" ng-click="$ctrl.metadata.value = !$ctrl.metadata.value" ng-checked="$ctrl.metadata.value" aria-label="...">
              <div class="control__indicator"></div>
            </label>
          </div>
          <div ng-switch-when="enum"  style="padding-top:5px;">
            <dropdown-select options="$ctrl.metadata.options" selected="$ctrl.metadata.value"></dropdown-select>
          </div>
          <div ng-switch-when="filepath">
            <file-chooser model="$ctrl.metadata.value" options="$ctrl.metadata.fileOptions"></file-chooser></file-chooser>
          </div>
          <div ng-switch-when="effectlist">
            <effect-list header="" effects="$ctrl.metadata.value" trigger="{{$ctrl.trigger}}" update="$ctrl.effectListUpdated(effects)" modalId="{{$ctrl.modalId}}" is-array="true"></effect-list>
          </div>
       </div>
       <hr ng-if="$ctrl.metadata.showBottomHr" style="margin-top:10px; margin-bottom:15px;" />
       `,
            controller: function() {
                let ctrl = this;

                //If there is no value, supply the default.
                ctrl.$onInit = function() {
                    if (ctrl.metadata.value == null) {
                        ctrl.metadata.value = ctrl.metadata.default;

                        // If its an enum and no default is supplied, select the first one
                        if (ctrl.metadata.type === 'enum') {
                            if (ctrl.metadata.default == null) {
                                ctrl.metadata.value = ctrl.metadata.options[0];
                            }
                        }
                    }
                };

                ctrl.effectListUpdated = function(effects) {
                    ctrl.metadata.value = effects;
                };
            }
        });
}());

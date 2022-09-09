"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp").component("commandOption", {
        bindings: {
            metadata: "=",
            name: "<?",
            onUpdate: "&"
        },
        template: `
       <div ng-switch="$ctrl.metadata.type" style="padding-bottom: 20px;font-size: 15px;font-weight: 600;">

          <div style="margin-bottom: 5px;">{{$ctrl.metadata.type != 'boolean' && $ctrl.metadata.title ? $ctrl.metadata.title : ""}}</div>
          <div ng-if="$ctrl.metadata.type != 'boolean' && $ctrl.metadata.description" style="padding-bottom: 5px;font-size: 14px;font-weight: 100;opacity:0.8;">{{$ctrl.metadata.description}}</div>

          <div ng-switch-when="string">
            <textarea ng-if="$ctrl.metadata.useTextArea" ng-model="$ctrl.metadata.value" class="form-control" placeholder="Enter text" rows="5" style="width:100%"></textarea>
            <input ng-if="!$ctrl.metadata.useTextArea" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="password">
            <input class="form-control" type="password" placeholder="Enter password" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="number">
            <input class="form-control" type="number" placeholder="{{$ctrl.metadata.placeholder ? $ctrl.metadata.placeholder : 'Enter a number'}}" ng-model="$ctrl.metadata.value">
          </div>

          <div ng-switch-when="boolean" style="padding-top:10px;">
            <label class="control-fb control--checkbox" style="font-weight: 600;">
              {{$ctrl.metadata.title ? $ctrl.metadata.title : $ctrl.name}}
              <tooltip ng-if="$ctrl.metadata.description" text="$ctrl.metadata.description"></tooltip>
              <input type="checkbox" ng-click="$ctrl.metadata.value = !$ctrl.metadata.value" ng-checked="$ctrl.metadata.value" aria-label="...">
              <div class="control__indicator"></div>
            </label>
          </div>

          <div ng-switch-when="enum" style="padding-top:5px;">
            <dropdown-select options="$ctrl.metadata.options" selected="$ctrl.metadata.value"></dropdown-select>
          </div>

          <div ng-switch-when="filepath">
            <file-chooser model="$ctrl.metadata.value" options="$ctrl.metadata.fileOptions"></file-chooser></file-chooser>
          </div>

          <div ng-switch-when="role-percentages">
            <role-percentages model="$ctrl.metadata.value"></role-percentages>
          </div>

          <div ng-switch-when="role-numbers">
            <role-numbers model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></role-numbers>
          </div>

          <div ng-switch-when="currency-select" style="padding-top:5px;">
            <currency-select model="$ctrl.metadata.value"></currency-select>
          </div>

          <div ng-switch-when="chatter-select" style="padding-top:5px;">
            <chatter-select model="$ctrl.metadata.value"></chatter-select>
          </div>

          <div ng-switch-when="editable-list" style="padding-top:5px;">
            <editable-list model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></editable-list>
          </div>

          <div ng-switch-when="multiselect" style="padding-top:5px;">
            <multiselect-list model="$ctrl.metadata.value" settings="$ctrl.metadata.settings"></multiselect-list>
          </div>

          <div ng-switch-when="discord-channel-webhooks" style="padding-top:5px;">
            <discord-channel-webhooks model="$ctrl.metadata.value"></discord-channel-webhooks>
          </div>

          <div ng-switch-when="gift-receivers-list" class="pt-5">
            <gift-receivers-list model="$ctrl.metadata.value"></gift-receivers-list>
          </div>

          <div ng-switch-when="effectlist">
            <effect-list effects="$ctrl.metadata.value" trigger="unknown" trigger-meta="$ctrl.triggerMeta" update="$ctrl.effectListUpdated(effects)" modalId="{{$ctrl.modalId}}" is-array="true"></effect-list>
          </div>

          <div ng-if="$ctrl.metadata.tip != null && $ctrl.metadata.tip !== ''" class="muted" style="font-size:12px; padding-top: 3px;">{{$ctrl.metadata.tip}}</div>
       </div>

       <hr ng-if="$ctrl.metadata.showBottomHr" style="margin-top:10px; margin-bottom:15px;" />
       `,
        controller: function($scope) {
            const ctrl = this;

            $scope.$watchCollection("$ctrl.metadata", (changes) => {
                if (changes.key === 'isAnonymous') {
                    ctrl.onUpdate({ value: changes.value });
                }
            });

            //If there is no value, supply the default.
            ctrl.$onInit = function() {
                if (ctrl.metadata.value === undefined || ctrl.metadata.value === null) {
                    ctrl.metadata.value = ctrl.metadata.default;

                    // If its an enum and no default is supplied, select the first one
                    if (ctrl.metadata.type === "enum") {
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

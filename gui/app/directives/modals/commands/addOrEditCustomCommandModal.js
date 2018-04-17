"use strict";

// Modal for adding or editting a command

(function() {
  angular.module("firebotApp").component("addOrEditCustomCommandModal", {
    template: `
      <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title">
            <span ng-if="!$ctrl.isNewCommand">Edit Command - </span> {{$ctrl.isNewCommand ? 'Add New Command' : $ctrl.command.trigger }}
          </h4>
      </div>
      <div class="modal-body">
          <div class="general-button-settings">
              <div class="settings-title">
                  <h3>General Settings</h3>
              </div>

              <div class="input-group">
                  <span class="input-group-addon" id="basic-addon3">Trigger</span>
                  <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.command.trigger">
              </div>

              <div class="input-group">
                <span class="input-group-addon">Global Cooldown</span>
                <input 
                  class="form-control" 
                  type="number"
                  min="0"
                  ng-model="$ctrl.command.cooldown.global">
                <span class="input-group-addon">User Cooldown</span>
                <input 
                  class="form-control"
                  type="number"
                  min="1"
                  ng-model="$ctrl.command.cooldown.user">
              </div>

              <div class="settings-restrict" style="padding-bottom:1em">
                  <!--<div class="settings-title">
                      <h3>Permissions</h3>
                  </div>
                  <div class="permission-type controls-fb-inline">
                      <label class="control-fb control--radio">None
                          <input type="radio" ng-model="command.permissionType" ng-value="undefined" ng-click="clearPermissions()"/>
                          <div class="control__indicator"></div>
                      </label>
                      <label class="control-fb control--radio">Group
                          <input type="radio" ng-model="command.permissionType" value="Group"/>
                          <div class="control__indicator"></div>
                      </label>
                      <label class="control-fb control--radio">Individual
                          <input type="radio" ng-model="command.permissionType" value="Individual" ng-click="clearPermissions()"/>
                          <div class="control__indicator"></div>
                      </label>             
                  </div>
              </div>
              <div class="settings-permission" style="padding-bottom:1em">
                  <div class=" viewer-group-list" ng-if="command.permissionType === 'Group'">
                      <label ng-repeat="group in viewerGroups" class="control-fb control--checkbox">{{group}}
                          <input type="checkbox" ng-click="groupArray(command.permissions, group)" ng-checked="groupCheckboxer(command.permissions, group)"  aria-label="..." >
                          <div class="control__indicator"></div>
                      </label>
                  </div>
                  <div ng-if="command.permissionType === 'Individual'" class="input-group">
                      <span class="input-group-addon" id="basic-addon3">Username</span>
                      <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="command.permissions">        
                  </div>
              </div>-->

              <div class="other-settings" style="padding-bottom:1em">
                  <div class="settings-title">
                      <h3>Other</h3>
                  </div>
                  <div class="controls-fb-inline">
                      <label class="control-fb control--checkbox">Active Command
                          <input type="checkbox" ng-model="$ctrl.command.active" aria-label="..." checked>
                          <div class="control__indicator"></div>
                      </label>
                      <label class="control-fb control--checkbox">Show In Chat Feed <tooltip text="'Whether or not you want to see an alert in the chat feed when someone uses this command'"></tooltip>
                          <input type="checkbox" ng-model="$ctrl.command.chatFeedAlert" aria-label="...">
                          <div class="control__indicator"></div>
                      </label>
                      <label class="control-fb control--checkbox">Skip Logging
                          <input type="checkbox" ng-model="$ctrl.command.skipLog" aria-label="...">
                          <div class="control__indicator"></div>
                      </label>
                  </div>
              </div>
          </div>
          <div class="function-button-settings">
              <effect-list header="What should this command do?" effects="$ctrl.command.effects" trigger="command" update="$ctrl.effectListUpdated(effects)" is-array="true"></effect-list>
          </div>
      </div>

      <div class="modal-footer">
          <button type="button" class="btn btn-danger pull-left" ng-show="!$ctrl.isNewCommand" ng-click="$ctrl.deleteCommand(command)">Delete Command</button>
          <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="button" class="btn btn-primary add-new-board-save" ng-click="$ctrl.saveChanges()">Save Changes</button>
      </div>
            `,
    bindings: {
      resolve: "<",
      close: "&",
      dismiss: "&"
    },
    controller: function() {
      let $ctrl = this;

      $ctrl.command = {
        active: true,
        cooldown: {},
        permission: {},
        effects: []
      };

      $ctrl.$onInit = function() {
        if ($ctrl.resolve.command == null) {
          $ctrl.isNewCommand = true;
        } else {
          $ctrl.command = $ctrl.resolve.command;
        }
        // When the compontent is initialized
        // This is where you can start to access bindings, such as variables stored in 'resolve'
        // IE $ctrl.resolve.shouldDelete or whatever
      };
    }
  });
})();

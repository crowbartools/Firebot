"use strict";

(function() {
    angular.module("firebotApp").component("permissionOptions", {
        bindings: {
            permission: "=",
            hideTitle: "<"
        },
        template: `
      <div>
        <div class="settings-restrict" style="padding-bottom:1em">
            <div ng-hide="$ctrl.hideTitle === true" class="settings-title">
                <h3>Permissions</h3>
            </div>
            <div class="permission-type controls-fb-inline">
                <label class="control-fb control--radio">None
                    <input type="radio" ng-model="$ctrl.permission.type" value="none"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Group
                    <input type="radio" ng-model="$ctrl.permission.type" value="group"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Individual
                    <input type="radio" ng-model="$ctrl.permission.type" value="individual"/>
                    <div class="control__indicator"></div>
                </label>             
            </div>
        </div>
        <div class="settings-permission" style="padding-bottom:1em">
            <div class=" viewer-group-list" ng-if="$ctrl.permission.type === 'group'">
                <label ng-repeat="group in $ctrl.viewerGroups" class="control-fb control--checkbox">{{group}}
                    <input type="checkbox" ng-click="$ctrl.toggleGroup(group)" ng-checked="$ctrl.groupIsChecked(group)"  aria-label="..." >
                    <div class="control__indicator"></div>
                </label>
            </div>
            <div ng-if="$ctrl.permission.type === 'individual'" class="input-group">
                <span class="input-group-addon" id="basic-addon3">Username</span>
                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.permission.username">        
            </div>
        </div>
      </div>
    `,
        controller: function(groupsService) {
            let $ctrl = this;

            // Set active viewer groups for command permissions.
            $ctrl.viewerGroups = groupsService.getAllGroups();

            $ctrl.$onInit = function() {
                if ($ctrl.permission === null) {
                    $ctrl.permission = {
                        type: "none"
                    };
                }
            };

            // This is run each time a group checkbox is clicked or unclicked.
            // This will build an array of currently selected groups to be saved to JSON.
            $ctrl.toggleGroup = function(group) {
                if ($ctrl.permission.groups == null) {
                    $ctrl.permission.groups = [];
                }

                if ($ctrl.permission.groups.includes(group)) {
                    $ctrl.permission.groups = $ctrl.permission.groups.filter(
                        g => g !== group
                    );
                } else {
                    $ctrl.permission.groups.push(group);
                }
            };

            // This checks if an item is in the command.permission array and returns true.
            // This allows us to check boxes when loading up this button effect.
            $ctrl.groupIsChecked = function(group) {
                if ($ctrl.permission.groups == null) return false;
                return $ctrl.permission.groups.includes(group);
            };
        }
    });
}());

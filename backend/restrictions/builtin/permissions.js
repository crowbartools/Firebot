"use strict";

const customRolesManager = require("../../roles/custom-roles-manager");
const twitchRolesManager = require("../../../shared/twitch-roles");

const model = {
    definition: {
        id: "firebot:permissions",
        name: "Permissions",
        description: "Restrict based on viewer roles or username.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div class="mixplay-header" style="padding: 0 0 4px 0">
                Mode
            </div>
            <div style="margin-bottom: 10px">
                <label class="control-fb control--radio">Roles <span class="muted"><br />Restrict access to select viewer roles</span>
                    <input type="radio" ng-model="restriction.mode" value="roles"/> 
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Single Viewer <span class="muted"><br />Restrict access to a single viewer name</span>
                    <input type="radio" ng-model="restriction.mode" value="viewer"/>
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div ng-if="restriction.mode === 'roles'">
                <div id="roles" class="mixplay-header" style="padding: 0 0 4px 0">
                    Viewer Roles
                </div>
                <div class="viewer-group-list">
                    <div ng-show="hasCustomRoles" style="margin-bottom: 10px;">
                        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;font-family: 'Quicksand';margin-bottom: 5px;">Custom</div>
                        <label ng-repeat="customRole in getCustomRoles()" class="control-fb control--checkbox">{{customRole.name}}
                            <input type="checkbox" ng-click="toggleRole(customRole)" ng-checked="isRoleChecked(customRole)"  aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                    <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;font-family: 'Quicksand';margin-bottom: 5px;">Twitch</div>
                    <label ng-repeat="twitchRole in getTwitchRoles()" class="control-fb control--checkbox">{{twitchRole.name}}
                        <input type="checkbox" ng-click="toggleRole(twitchRole)" ng-checked="isRoleChecked(twitchRole)"  aria-label="..." >
                        <div class="control__indicator"></div>
                    </label>
                </div> 
            </div>

            <div ng-if="restriction.mode === 'viewer'">
                <div id="username" class="mixplay-header" style="padding: 0 0 4px 0">
                    Username
                </div>
                <input type="text" class="form-control" aria-describedby="username" ng-model="restriction.username" placeholder="Enter name">  
            </div>
        </div>
    `,
    optionsController: ($scope, viewerRolesService) => {
        if (!$scope.restriction.mode) {
            $scope.restriction.mode = "roles";
        }

        if (!$scope.restriction.roleIds) {
            $scope.restriction.roleIds = [];
        }

        $scope.hasCustomRoles = viewerRolesService.getCustomRoles().length > 0;
        $scope.getCustomRoles = viewerRolesService.getCustomRoles;
        $scope.getTwitchRoles = viewerRolesService.getTwitchRoles;

        $scope.isRoleChecked = function(role) {
            return $scope.restriction.roleIds.includes(role.id);
        };

        $scope.toggleRole = function(role) {
            if ($scope.isRoleChecked(role)) {
                $scope.restriction.roleIds = $scope.restriction.roleIds.filter(id => id !== role.id);
            } else {
                $scope.restriction.roleIds.push(role.id);
            }
        };
    },
    optionsValueDisplay: (restriction, viewerRolesService) => {
        if (restriction.mode === "roles") {
            let roleIds = restriction.roleIds;
            let output = "None selected";
            if (roleIds.length > 0) {
                output = roleIds
                    .filter(id => viewerRolesService.getRoleById(id) != null)
                    .map(id => viewerRolesService.getRoleById(id).name)
                    .join(", ");
            }
            return `Roles (${output})`;
        } else if (restriction.mode === "viewer") {
            return `Viewer (${restriction.username ? restriction.username : 'No name'})`;
        }
        return "";
    },
    predicate: (triggerData, restrictionData) => {
        return new Promise((resolve, reject) => {
            if (restrictionData.mode === "roles") {

                let username = triggerData.metadata.username;

                let userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
                let userTwitchRoles = (triggerData.metadata.userTwitchRoles || [])
                    .map(mr => twitchRolesManager.mapTwitchRole(mr));

                let allRoles = userCustomRoles.concat(userTwitchRoles).filter(r => r != null);

                let expectedRoleIds = restrictionData.roleIds || [];

                // convert any mixer roles to twitch roles
                expectedRoleIds = expectedRoleIds.map(r => twitchRolesManager.mapMixerRoleIdToTwitchRoleId(r));

                let hasARole = allRoles.some(r => expectedRoleIds.includes(r.id));

                if (hasARole) {
                    resolve();
                } else {
                    reject("You do not have permission");
                }

            } else if (restrictionData.mode === "viewer") {
                let username = (triggerData.metadata.username || "").toLowerCase();
                if (username === restrictionData.username.toLowerCase()) {
                    resolve();
                } else {
                    reject("You do not have permission");
                }
            } else {
                resolve();
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;
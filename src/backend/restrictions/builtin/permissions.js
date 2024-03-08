"use strict";

const chatRolesManager = require("../../roles/chat-roles-manager");
const customRolesManager = require("../../roles/custom-roles-manager");
const teamRolesManager = require("../../roles/team-roles-manager");
const twitchRolesManager = require("../../../shared/twitch-roles");
const twitchApi = require("../../twitch-api/api");

const model = {
    definition: {
        id: "firebot:permissions",
        name: "Permissions",
        description: "Restrict based on viewer roles or username.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div class="modal-subheader" style="padding: 0 0 4px 0">
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
                <div id="roles" class="modal-subheader" style="padding: 0 0 4px 0">
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
                    <div ng-show="getTeamRoles().length > 0" style="margin-bottom: 10px;">
                        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;font-family: 'Quicksand';margin-bottom: 5px;">Teams</div>
                        <label ng-repeat="teamRole in getTeamRoles()" class="control-fb control--checkbox">{{teamRole.name}}
                            <input type="checkbox" ng-click="toggleRole(teamRole)" ng-checked="isRoleChecked(teamRole)"  aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div ng-if="restriction.mode === 'viewer'">
                <div id="username" class="modal-subheader" style="padding: 0 0 4px 0">
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
        $scope.getTeamRoles = viewerRolesService.getTeamRoles;
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
            const roleIds = restriction.roleIds;
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
        return new Promise(async (resolve, reject) => {
            if (restrictionData.mode === "roles") {
                let userId = triggerData.metadata.userId;

                if (userId == null) {
                    const username = triggerData.metadata.username;
                    const user = await twitchApi.users.getUserByName(username);

                    if (user == null) {
                        reject("User does not exist");
                    }

                    userId = user.id;
                }

                /** @type {string[]} */
                let twitchUserRoles = triggerData.metadata.userTwitchRoles;

                // For sub tier-specific/known bot permission checking, we have to get live data
                if (twitchUserRoles == null
                    || restrictionData.roleIds.includes("tier1")
                    || restrictionData.roleIds.includes("tier2")
                    || restrictionData.roleIds.includes("tier3")
                    || restrictionData.roleIds.includes("viewerlistbot")
                ) {
                    twitchUserRoles = await chatRolesManager.getUsersChatRoles(userId);
                }

                const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(userId) || [];
                const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(userId) || [];
                const userTwitchRoles = (twitchUserRoles || [])
                    .map(mr => twitchRolesManager.mapTwitchRole(mr));

                const allRoles = [
                    ...userTwitchRoles,
                    ...userTeamRoles,
                    ...userCustomRoles
                ].filter(r => r != null);

                // convert any mixer roles to twitch roles
                const expectedRoleIds = (restrictionData.roleIds || [])
                    .map(r => twitchRolesManager.mapMixerRoleIdToTwitchRoleId(r));

                const hasARole = allRoles.some(r => expectedRoleIds.includes(r.id));

                if (hasARole) {
                    resolve();
                } else {
                    reject("You do not have permission");
                }
            } else if (restrictionData.mode === "viewer") {
                const username = (triggerData.metadata.username || "").toLowerCase();
                if (username === restrictionData.username.toLowerCase()) {
                    resolve();
                } else {
                    reject("You do not have permission");
                }
            } else {
                resolve();
            }
        });
    }
};

module.exports = model;
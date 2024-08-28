"use strict";

const chatRolesManager = require("../../roles/chat-roles-manager");
const customRolesManager = require("../../roles/custom-roles-manager");
const teamRolesManager = require("../../roles/team-roles-manager");
const twitchRolesManager = require("../../../shared/twitch-roles");
const twitchApi = require("../../twitch-api/api");
const rankManager = require("../../ranks/rank-manager");
const viewerDatabase = require("../../viewers/viewer-database");

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
                <label class="control-fb control--radio">Roles & Ranks <span class="muted"><br />Restrict access to select viewer roles & ranks</span>
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
                    Roles
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

                <div id="roles" class="modal-subheader mt-4" style="padding: 0 0 4px 0">
                    Ranks
                </div>
                <div class="viewer-group-list">
                    <div ng-show="hasRankLadders" style="margin-bottom: 10px;" ng-repeat="ladder in rankLadders">
                        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;font-family: 'Quicksand';margin-bottom: 5px;">{{ladder.name}}</div>
                        <label ng-repeat="rank in ladder.ranks" class="control-fb control--checkbox">{{rank.name}}
                            <input type="checkbox" ng-click="toggleRank(ladder, rank)" ng-checked="isRankChecked(ladder, rank)"  aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                    <div ng-if="!hasRankLadders" style="margin-bottom: 10px;">
                        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;font-family: 'Quicksand';margin-bottom: 5px;">No ranks saved.</div>
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
    optionsController: ($scope, viewerRolesService, viewerRanksService) => {
        if (!$scope.restriction.mode) {
            $scope.restriction.mode = "roles";
        }

        if (!$scope.restriction.roleIds) {
            $scope.restriction.roleIds = [];
        }

        if (!$scope.restriction.ranks) {
            $scope.restriction.ranks = [];
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

        $scope.rankLadders = viewerRanksService.rankLadders;
        $scope.hasRankLadders = $scope.rankLadders.length > 0;

        $scope.isRankChecked = function(rankLadder, rank) {
            return $scope.restriction.ranks.some(r => r.ladderId === rankLadder.id && r.rankId === rank.id);
        };

        $scope.toggleRank = function(rankLadder, rank) {
            if ($scope.isRankChecked(rankLadder, rank)) {
                $scope.restriction.ranks = $scope.restriction.ranks.filter(r => r.ladderId !== rankLadder.id || r.rankId !== rank.id);
            } else {
                $scope.restriction.ranks.push({ ladderId: rankLadder.id, rankId: rank.id });
            }
        };
    },
    optionsValueDisplay: (restriction, viewerRolesService, viewerRanksService) => {
        if (restriction.mode === "roles") {
            const roleIds = restriction.roleIds;
            let rolesOutput = "None selected";
            if (roleIds.length > 0) {
                rolesOutput = roleIds
                    .filter(id => viewerRolesService.getRoleById(id) != null)
                    .map(id => viewerRolesService.getRoleById(id).name)
                    .join(", ");
            }
            const rolesDisplay = `Roles (${rolesOutput})`;

            const ranks = restriction.ranks ?? [];
            let ranksOutput = "None selected";
            if (ranks.length > 0) {
                const groupedByLadder = ranks.reduce((acc, r) => {
                    if (!acc.some(l => l.ladderId === r.ladderId)) {
                        acc.push({ ladderId: r.ladderId, rankIds: [] });
                    }
                    const ladder = acc.find(l => l.ladderId === r.ladderId);
                    ladder.rankIds.push(r.rankId);
                    return acc;
                }, []);
                ranksOutput = groupedByLadder
                    .filter(r => viewerRanksService.getRankLadder(r.ladderId) != null)
                    .map((r) => {
                        const ladder = viewerRanksService.getRankLadder(r.ladderId);
                        const rankNames = r.rankIds
                            .map(id => ladder.ranks.find(rank => rank.id === id))
                            .filter(rank => rank != null)
                            .map(rank => rank.name);
                        return `${ladder.name}: ${rankNames.join(", ")}`;
                    })
                    .join(", ");
            }
            const ranksDisplay = `Ranks (${ranksOutput})`;

            const itemsToDisplay = [];
            if (rolesOutput !== "None selected") {
                itemsToDisplay.push(rolesDisplay);
            }
            if (ranksOutput !== "None selected") {
                itemsToDisplay.push(ranksDisplay);
            }
            return itemsToDisplay.length > 0 ? itemsToDisplay.join(", ") : "Roles/Ranks (None selected)";
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

                const expectedRanks = (restrictionData.ranks || [])
                    .filter(r => rankManager.getItem(r.ladderId) != null);

                let hasARank = false;

                const viewer = await viewerDatabase.getViewerById(userId);
                if (viewer) {
                    const rankLadders = rankManager.getRankLadderHelpers();
                    for (const rankDetails of expectedRanks) {
                        const ladder = rankLadders.find(l => l.id === rankDetails.ladderId);
                        if (ladder != null) {
                            const rank = ladder.getRank(rankDetails.rankId);
                            if (rank != null) {
                                hasARank = await viewerDatabase.viewerHasRank(viewer, ladder.id, rank.id);
                                if (hasARank) {
                                    break;
                                }
                            }
                        }
                    }
                }

                if (hasARole || hasARank) {
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
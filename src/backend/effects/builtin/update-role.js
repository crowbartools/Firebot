"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');
const twitchApi = require("../../twitch-api/api");
const customRolesManager = require("../../roles/custom-roles-manager");
const logger = require('../../logwrapper');

/**
 * The Delay effect
 */
const delay = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:update-roles",
        name: "Update Viewer Roles",
        description: "Add, remove, or clear users from a custom role.",
        icon: "fad fa-user-tag",
        categories: [EffectCategory.ADVANCED],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `

    <eos-container header="Custom Role Actions" pad-top="true">
            <div>
                <label class="control-fb control--checkbox"> Add user to role</tooltip>
                    <input type="checkbox" ng-init="shouldAddRole = (effect.addRoleId != null && effect.addRoleId !== '')" ng-model="shouldAddRole" ng-click="effect.addRoleId = undefined">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!shouldAddRole" style="margin: 0 0 15px 15px;">
                    <div class="btn-group" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{getRoleName(effect.addRoleId)}} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-repeat="role in roles" ng-click="effect.addRoleId = role.id"><a href>{{role.name}}</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> Remove user from role</tooltip>
                    <input type="checkbox" ng-init="shouldRemoveRole = (effect.removeRoleId != null && effect.removeRoleId !== '')" ng-model="shouldRemoveRole" ng-click="effect.removeRoleId = undefined">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!shouldRemoveRole" style="margin: 0 0 15px 15px;">
                    <div class="btn-group" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{getRoleName(effect.removeRoleId)}} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-repeat="role in roles" ng-click="effect.removeRoleId = role.id"><a href>{{role.name}}</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style="margin-top:5px;">
                <label class="control-fb control--checkbox"> Remove all users from role</tooltip>
                    <input type="checkbox" ng-init="shouldRemoveAllRole = (effect.removeAllRoleId != null && effect.removeAllRoleId !== '')" ng-model="shouldRemoveAllRole" ng-click="effect.removeAllRoleId = undefined">
                    <div class="control__indicator"></div>
                </label>
                <div uib-collapse="!shouldRemoveAllRole" style="margin: 0 0 15px 15px;">
                    <div class="btn-group" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{getRoleName(effect.removeAllRoleId)}} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-repeat="role in roles" ng-click="effect.removeAllRoleId = role.id"><a href>{{role.name}}</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </eos-container>

        <eos-container header="Viewer" ng-show="effect.removeRoleId != null || effect.addRoleId != null">
            <div style="padding: 0 10px 0 0;">
                <label class="control-fb control--radio">Associated viewer <tooltip text="'The viewer who pressed this button/ran the command/etc.'"></tooltip>
                    <input type="radio" ng-model="effect.viewerType" value="current"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" style="margin-bottom: 10px;">Custom viewer
                    <input type="radio" ng-model="effect.viewerType" value="custom"/>
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="effect.viewerType === 'custom'" style="padding-left: 30px;">
                    <input class="form-control" type="text" ng-model="effect.customViewer" placeholder="Username" replace-variables></input>
                </div>
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, viewerRolesService) => {

        if ($scope.effect.viewerType == null) {
            $scope.effect.viewerType = "current";
        }

        $scope.roles = viewerRolesService.getCustomRoles();

        $scope.getRoleName = (roleId) => {
            const role = $scope.roles.find(r => r.id === roleId);
            return role ? role.name : "Select one";
        };
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const effect = event.effect;
        
        if (effect.removeAllRoleId) {
            customRolesManager.removeAllViewersFromRole(effect.removeAllRoleId);
            return;
        }

        let username = "";
        if (effect.viewerType === "current") {
            username = event.trigger.metadata.username;
        } else {
            username = effect.customViewer ? effect.customViewer.trim() : "";
        }

        const user = await twitchApi.users.getUserByName(username);
        if (user == null) {
            logger.warn(`Unable to ${effect.addRoleId ? "add" : "remove"} custom role for ${username}. User does not exist.`);
            return;
        }

        if (effect.addRoleId) {
            customRolesManager.addViewerToRole(effect.addRoleId, {
                id: user.id,
                username: user.name,
                displayName: user.displayName
            });
        }

        if (effect.removeRoleId) {
            customRolesManager.removeViewerFromRole(effect.removeRoleId, user.id);
        }

        return true;
    }
};

module.exports = delay;

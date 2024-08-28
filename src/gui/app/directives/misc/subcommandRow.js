"use strict";

(function() {
    angular.module("firebotApp").component("subcommandRow", {
        bindings: {
            subcommand: "=",
            fullyEditable: "<",
            cmdTrigger: "@",
            onDelete: "&",
            onEdit: "&"
        },
        template: `
            <div class="mb-4">
                <div class="sys-command-row" ng-init="hidePanel = true" ng-click="hidePanel = !hidePanel" ng-class="{'expanded': !hidePanel}">
                    <div class="pl-8"" style="flex-basis: 30%;">
                        {{$ctrl.subcommand.regex || $ctrl.subcommand.fallback ? ($ctrl.subcommand.usage || "").split(" ")[0] : $ctrl.subcommand.arg}}
                        <span ng-show="$ctrl.fullyEditable">
                            <i ng-if="$ctrl.subcommandTypeTitle() === 'Number'" class="far fa-hashtag muted text-lg" uib-tooltip="Number subcommand"></i>
                            <i ng-if="$ctrl.subcommandTypeTitle() === 'Username'" class="far fa-at muted text-lg" uib-tooltip="Username subcommand"></i>
                        </span>
                    </div>

                    <div style="width: 25%">
                        <div ng-if="!$ctrl.subcommand.inheritBaseCommandCooldown">
                            <span style="min-width: 51px; display: inline-block;" uib-tooltip="Global cooldown">
                                <i class="fal fa-globe"></i> {{$ctrl.subcommand.cooldown.global ? $ctrl.subcommand.cooldown.global + "s" : "-" }}
                            </span>
                            <span uib-tooltip="User cooldown">
                                <i class="fal fa-user"></i> {{$ctrl.subcommand.cooldown.user ? $ctrl.subcommand.cooldown.user + "s" : "-" }}
                            </span>
                        </div>
                        <div ng-if="$ctrl.subcommand.inheritBaseCommandCooldown">
                            <span style="text-transform: capitalize;">Inherited</span>
                            <tooltip type="info" text="'This subcommand will use the cooldowns of the base command.'"></tooltip>
                        </div>
                    </div>

                    <div style="width: 25%">
                        <span style="text-transform: capitalize;">{{$ctrl.getPermissionType()}}</span>
                        <tooltip type="info" text="$ctrl.getPermissionTooltip()"></tooltip>
                    </div>

                    <div style="width: 25%">
                        <div style="min-width: 75px">
                            <span class="status-dot" ng-class="{'active': $ctrl.subcommand.active, 'notactive': !$ctrl.subcommand.active}"></span>
                            {{$ctrl.subcommand.active ? "Active" : "Disabled"}}
                        </div>
                    </div>

                    <div style="flex-basis:30px; flex-shrink: 0;">
                        <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                    </div>
                </div>

                <div uib-collapse="hidePanel" class="sys-command-expanded">
                    <div class="sub-command p-8">
                        <div>
                            <div class="settings-title">
                                <h4 class="font-semibold">Description <tooltip class="text-2xl ml-1" text="'Displayed on the command list webpage'"></tooltip></h4>
                            </div>
                            <input
                                class="form-control"
                                type="text"
                                placeholder="Enter description"
                                ng-model="$ctrl.subcommand.description"
                                aria-describedby="subcommandDescription"
                            >
                            <p ng-hide="$ctrl.fullyEditable">{{$ctrl.subcommand.description}}</p>
                        </div>

                        <div class="mt-10">
                            <div class="settings-title">
                                <h4 class="font-semibold">Usage</h4>
                            </div>
                            <p ng-show="!$ctrl.fullyEditable">{{$ctrl.cmdTrigger}} {{$ctrl.subcommand.usage ? $ctrl.subcommand.usage : $ctrl.subcommand.arg}}</p>
                            <div class="input-group" ng-hide="!$ctrl.fullyEditable">
                                <span class="input-group-addon">{{$ctrl.cmdTrigger}}{{!$ctrl.subcommand.regex ? " " + $ctrl.subcommand.arg : ""}}</span>
                                <input ng-hide="$ctrl.subcommand.regex" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.compiledUsage" ng-change="$ctrl.onUsageChange()">
                                <input ng-show="$ctrl.subcommand.regex" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.subcommand.usage">
                            </div>
                        </div>

                        <div class="mt-10" ng-show="$ctrl.fullyEditable">
                            <div class="settings-title">
                                <h4 class="font-semibold">
                                    Required Additional Arg Count
                                    <tooltip class="text-2xl ml-1" text="'The number of additional required args after the subcommands arg. If this number is not met, effects will not be triggered.'" />
                                </h4>
                            </div>
                            <input
                                ng-show="$ctrl.fullyEditable"
                                class="form-control"
                                type="number"
                                placeholder="Enter count"
                                ng-model="$ctrl.adjustedMinArgs"
                                ng-change="$ctrl.onMinArgsChange()"
                            >
                        </div>

                        <div class="mt-10" ng-hide="$ctrl.subcommand.hideCooldowns">
                            <div class="settings-title">
                                <h4 class="font-semibold">Cooldowns</h4>
                            </div>
                            <firebot-checkbox
                                model="$ctrl.subcommand.inheritBaseCommandCooldown"
                                label="Inherit base command cooldowns"
                                tooltip="If enabled, this subcommand will use the cooldowns set on the base command."
                            />
                            <command-cooldown-settings
                                ng-if="!$ctrl.subcommand.inheritBaseCommandCooldown"
                                command="$ctrl.subcommand"
                                message-setting-disabled="true"
                            />
                            <command-cooldown-settings
                                ng-if="$ctrl.subcommand.inheritBaseCommandCooldown"
                                disabled="true"
                                command="{ cooldown: {}}"
                                message-setting-disabled="true"
                            />
                        </div>

                        <div class="mt-10">
                            <div class="settings-title">
                                <h4 class="mb-2 font-semibold">
                                    Restrictions
                                    <span class="muted pl-1 text-xl font-medium" style="font-family: 'Quicksand';">
                                        (Permissions, currency costs, and more)
                                    </span>
                                </h4>
                            </div>
                            <restrictions-list
                                restriction-data="$ctrl.subcommand.restrictionData"
                                trigger="command"
                            ></restrictions-section>
                        </div>

                        <div class="mt-10">
                            <div class="settings-title">
                                <h4 class="font-semibold">Settings</h4>
                            </div>
                            <div class="controls-fb-inline pb-4">
                            <label class="control-fb control--checkbox">
                                Is Active
                                <input type="checkbox" ng-model="$ctrl.subcommand.active" aria-label="..." checked>
                                <div class="control__indicator"></div>
                            </label>

                            <label class="control-fb control--checkbox">
                                Auto Delete Trigger <tooltip text="'Have Firebot automatically delete the message that triggers this subcommand to keep chat cleaner.'"></tooltip>
                                <input type="checkbox" ng-model="$ctrl.subcommand.autoDeleteTrigger" aria-label="...">
                                <div class="control__indicator"></div>
                            </label>

                            <label class="control-fb control--checkbox">
                                Hidden <tooltip text="'Hide this subcommand from the !commands list'"></tooltip>
                                <input type="checkbox" ng-model="$ctrl.subcommand.hidden" aria-label="...">
                                <div class="control__indicator"></div>
                            </label>
                            </div>
                        </div>

                        <div ng-if="$ctrl.fullyEditable" class="mt-6">
                            <effect-list
                                header="What should this subcommand do?"
                                effects="$ctrl.subcommand.effects"
                                trigger="command"
                                trigger-meta="{ rootEffects: $ctrl.subcommand.effects }"
                                update="$ctrl.effectListUpdated(effects)"
                                is-array="true"
                            ></effect-list>

                            <div class="mt-10">
                                <button class="btn btn-danger" ng-click="$ctrl.delete()" aria-label="Delete subcommand">
                                    <i class="far fa-trash"></i>
                                </button>
                                <button ng-hide="$ctrl.subcommand.fallback" class="btn btn-default ml-2" ng-click="$ctrl.edit()" aria-label="Edit subcommand">
                                    <i class="far fa-edit"></i> Edit Trigger
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        controller: function(viewerRolesService) {
            const $ctrl = this;

            $ctrl.subcommandTypeTitle = () => {
                if ($ctrl.fullyEditable) {
                    if (!$ctrl.subcommand.regex) {
                        return "Custom";
                    } else if ($ctrl.subcommand.fallback) {
                        return "Fallback";
                    } else if ($ctrl.subcommand.arg === '\\d+') {
                        return "Number";
                    } else if ($ctrl.subcommand.arg === '@\\w+') {
                        return "Username";
                    }
                }

                return "";
            };

            $ctrl.compiledUsage = "";
            $ctrl.onUsageChange = () => {
                $ctrl.subcommand.usage = `${$ctrl.subcommand.arg} ${$ctrl.compiledUsage}`;
            };

            $ctrl.adjustedMinArgs = 0;
            $ctrl.onMinArgsChange = () => {
                if ($ctrl.adjustedMinArgs > 0) {
                    $ctrl.subcommand.minArgs = $ctrl.adjustedMinArgs + 1;
                } else {
                    $ctrl.subcommand.minArgs = 1;
                }
            };

            $ctrl.$onInit = function() {
                if ($ctrl.subcommand) {
                    if ((!$ctrl.subcommand.regex && !$ctrl.subcommand.fallback) && $ctrl.subcommand.usage) {
                        $ctrl.compiledUsage = $ctrl.subcommand.usage.replace(`${$ctrl.subcommand.arg} `, "");
                    }
                    if ($ctrl.subcommand.minArgs > 0) {
                        $ctrl.adjustedMinArgs = $ctrl.subcommand.minArgs - 1;
                    }
                }
            };

            $ctrl.delete = () => {
                $ctrl.onDelete({ id: $ctrl.subcommand.id });
            };

            $ctrl.edit = () => {
                $ctrl.onEdit({ id: $ctrl.subcommand.id });
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.subcommand.effects = effects;
            };

            $ctrl.getPermissionType = () => {
                const command = $ctrl.subcommand;

                const permissions = command.restrictionData && command.restrictionData.restrictions &&
                command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                if (permissions) {
                    if (permissions.mode === "roles") {
                        return "Roles";
                    } else if (permissions.mode === "viewer") {
                        return "Viewer";
                    }
                } else {
                    return "Inherited";
                }
            };

            $ctrl.getPermissionTooltip = () => {
                const command = $ctrl.subcommand;
                const permissions = command.restrictionData && command.restrictionData.restrictions &&
                command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                if (permissions) {
                    if (permissions.mode === "roles") {
                        const roleIds = permissions.roleIds;
                        let output = "None selected";
                        if (roleIds.length > 0) {
                            output = roleIds
                                .filter(id => viewerRolesService.getRoleById(id) != null)
                                .map(id => viewerRolesService.getRoleById(id).name)
                                .join(", ");
                        }
                        return `Roles (${output})`;
                    } else if (permissions.mode === "viewer") {
                        return `Viewer (${permissions.username ? permissions.username : 'No name'})`;
                    }
                } else {
                    return "This subcommand will use the permissions of the base command.";
                }
            };
        }
    });
}());

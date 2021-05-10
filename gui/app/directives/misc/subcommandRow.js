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
      <div style="margin-bottom: 10px">
        <div class="sys-command-row" ng-init="hidePanel = true" ng-click="hidePanel = !hidePanel" ng-class="{'expanded': !hidePanel}">

          <div style="flex-basis: 30%;padding-left: 20px;">
            {{$ctrl.subcommand.regex || $ctrl.subcommand.fallback ? ($ctrl.subcommand.usage || "").split(" ")[0] : $ctrl.subcommand.arg}}
            <span ng-show="$ctrl.fullyEditable">
                <i ng-if="$ctrl.subcommandTypeTitle === 'Number'" class="far fa-hashtag muted" style="font-size: 11px;" uib-tooltip="Number subcommand"></i>
                <i ng-if="$ctrl.subcommandTypeTitle === 'Username'" class="far fa-at muted" style="font-size: 11px;" uib-tooltip="Username subcommand"></i>
            </span>
          </div>

          <div style="width: 25%">
            <span style="min-width: 51px; display: inline-block;" uib-tooltip="Global cooldown">
                <i class="fal fa-globe"></i> {{$ctrl.subcommand.cooldown.global ? $ctrl.subcommand.cooldown.global + "s" : "-" }}
            </span>
            <span uib-tooltip="User cooldown">
                <i class="fal fa-user"></i> {{$ctrl.subcommand.cooldown.user ? $ctrl.subcommand.cooldown.user + "s" : "-" }}
            </span>
          </div>

          <div style="width: 25%"><span style="text-transform: capitalize;">{{$ctrl.getPermissionType()}}</span> <tooltip type="info" text="$ctrl.getPermissionTooltip()"></tooltip></div>

          <div style="width: 25%">
            <div style="min-width: 75px">
                <span class="status-dot" ng-class="{'active': $ctrl.subcommand.active, 'notactive': !$ctrl.subcommand.active}"></span> {{$ctrl.subcommand.active ? "Active" : "Disabled"}}
            </div>
          </div>

          <div style="flex-basis:30px; flex-shrink: 0;">
            <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
          </div>
        </div>

        <div uib-collapse="hidePanel" class="sys-command-expanded">
          <div style="padding: 15px 20px 10px 20px;">
            <h4 ng-show="$ctrl.fullyEditable" style="margin-bottom: 20px; font-weight: 200;">{{$ctrl.subcommandTypeTitle}} Subcommand</h4>
            <div class="muted" style="font-weight:bold; font-size: 12px;">DESCRIPTION</div>
            <p style="font-size: 18px" ng-hide="$ctrl.fullyEditable">{{$ctrl.subcommand.description}}</p>
            <input class="form-control" style="margin-bottom: 20px;" ng-show="$ctrl.fullyEditable" type="text" placeholder="Enter text" ng-model="$ctrl.subcommand.description">

            <div style="margin-bottom:10px">
                <div class="muted" style="font-weight:bold; font-size: 12px;">USAGE</div>
                <p ng-show="!$ctrl.fullyEditable" style="font-size: 15px;font-weight: 600;">{{$ctrl.cmdTrigger}} {{$ctrl.subcommand.usage ? $ctrl.subcommand.usage : $ctrl.subcommand.arg}}</p>
                <div class="input-group" ng-hide="!$ctrl.fullyEditable">
                    <span class="input-group-addon" style="min-width: 0;">{{$ctrl.cmdTrigger}}{{!$ctrl.subcommand.regex ? " " + $ctrl.subcommand.arg : ""}}</span>
                    <input ng-hide="$ctrl.subcommand.regex" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.compiledUsage" ng-change="$ctrl.onUsageChange()">
                    <input ng-show="$ctrl.subcommand.regex" class="form-control" type="text" placeholder="Enter text" ng-model="$ctrl.subcommand.usage">
                </div>
            </div>

            <div ng-show="$ctrl.fullyEditable">
                <div class="muted" style="font-weight:bold; font-size: 12px;">REQUIRED ADDITIONAL ARG COUNT <tooltip text="'The number of additional required args after the subcommands arg. If this number is not met, effects will not be triggered.'" /></div>
                <input class="form-control" style="margin-bottom: 20px;" type="number" placeholder="Enter count" ng-model="$ctrl.adjustedMinArgs" ng-change="$ctrl.onMinArgsChange()">
            </div>
            
            <h4>Settings</h4>
            <div class="controls-fb-inline" style="padding-bottom:10px">
              <label class="control-fb control--checkbox">Is Active
                  <input type="checkbox" ng-model="$ctrl.subcommand.active" aria-label="..." checked>
                  <div class="control__indicator"></div>
              </label>

              <label class="control-fb control--checkbox">Auto Delete Trigger <tooltip text="'Have Firebot automatically delete the message that triggers this subcommand to keep chat cleaner.'"></tooltip>
                  <input type="checkbox" ng-model="$ctrl.subcommand.autoDeleteTrigger" aria-label="...">
                  <div class="control__indicator"></div>
              </label>

              <label class="control-fb control--checkbox">Hidden <tooltip text="'Hide this subcommand from the !commands list'"></tooltip>
                  <input type="checkbox" ng-model="$ctrl.subcommand.hidden" aria-label="...">
                  <div class="control__indicator"></div>
              </label>
            </div>

            <div style="padding-bottom:10px" ng-hide="$ctrl.subcommand.hideCooldowns">
              <div class="muted" style="font-weight:bold; font-size: 12px;">COOLDOWNS</div>
              <div class="input-group">
                <span class="input-group-addon">Global</span>
                <input
                    class="form-control"
                    type="number"
                    min="0"
                    placeholder="secs"
                    ng-model="$ctrl.subcommand.cooldown.global">
                <span class="input-group-addon">User</span>
                <input
                    class="form-control"
                    type="number"
                    min="0"
                    placeholder="secs"
                    ng-model="$ctrl.subcommand.cooldown.user">
              </div>
            </div>

            <div>
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 5px;">Restrictions <span class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">(Permissions, currency costs, and more)</span></h3>
                    <restrictions-list 
                        restriction-data="$ctrl.subcommand.restrictionData"
                        trigger="command">
                    </restrictions-section>
                </div>
            </div>

            <div ng-if="$ctrl.fullyEditable">
                <effect-list header="What should this subcommand do?" effects="$ctrl.subcommand.effects" trigger="command"
                    update="$ctrl.effectListUpdated(effects)" is-array="true"></effect-list>
                
                <div style="margin-top: 20px">
                    <button class="btn btn-danger" ng-click="$ctrl.delete()" aria-label="Delete subcommand">
                        <i class="far fa-trash"></i>
                    </button>
                    <button ng-hide="$ctrl.subcommand.fallback" class="btn btn-default" style="margin-left: 5px;" ng-click="$ctrl.edit()" aria-label="Edit subcommand">
                        <i class="far fa-edit"></i> Edit Trigger
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    `,
        controller: function(viewerRolesService, utilityService) {
            let $ctrl = this;

            $ctrl.subcommandTypeTitle = "";

            $ctrl.compiledUsage = "";
            $ctrl.onUsageChange = () => {
                $ctrl.subcommand.usage = $ctrl.subcommand.arg + " " + $ctrl.compiledUsage;
            };

            $ctrl.adjustedMinArgs = 0;
            $ctrl.onMinArgsChange = () => {
                if ($ctrl.adjustedMinArgs > 0) {
                    $ctrl.subcommand.minArgs = $ctrl.adjustedMinArgs + 1;
                }
            };

            $ctrl.$onInit = function() {
                if ($ctrl.subcommand) {
                    if ((!$ctrl.subcommand.regex && !$ctrl.subcommand.fallback) && $ctrl.subcommand.usage) {
                        $ctrl.compiledUsage = $ctrl.subcommand.usage.replace($ctrl.subcommand.arg + " ", "");
                    }
                    if ($ctrl.subcommand.minArgs > 0) {
                        $ctrl.adjustedMinArgs = $ctrl.subcommand.minArgs - 1;
                    }

                    if ($ctrl.fullyEditable) {
                        if (!$ctrl.subcommand.regex) {
                            $ctrl.subcommandTypeTitle = "Custom";
                        } else if ($ctrl.subcommand.fallback) {
                            $ctrl.subcommandTypeTitle = "Fallback";
                        } else if ($ctrl.subcommand.arg === '\\d+') {
                            $ctrl.subcommandTypeTitle = "Number";
                        } else if ($ctrl.subcommand.arg === '@\\w+') {
                            $ctrl.subcommandTypeTitle = "Username";
                        }
                        console.log($ctrl.subcommand.arg);
                    }
                }
            };

            $ctrl.delete = () => {
                utilityService.showConfirmationModal({
                    title: "Delete Subcommand",
                    question: `Are you sure you want to delete this subcommand?`,
                    confirmLabel: "Delete",
                    confirmBtnType: "btn-danger"
                }).then(confirmed => {
                    if (confirmed) {
                        $ctrl.onDelete({ id: $ctrl.subcommand.id });
                    }
                });
            };

            $ctrl.edit = () => {
                $ctrl.onEdit({ id: $ctrl.subcommand.id });
            };

            $ctrl.effectListUpdated = function(effects) {
                $ctrl.subcommand.effects = effects;
            };

            $ctrl.getPermissionType = () => {
                let command = $ctrl.subcommand;

                let permissions = command.restrictionData && command.restrictionData.restrictions &&
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
                let command = $ctrl.subcommand;
                let permissions = command.restrictionData && command.restrictionData.restrictions &&
                command.restrictionData.restrictions.find(r => r.type === "firebot:permissions");

                if (permissions) {
                    if (permissions.mode === "roles") {
                        let roleIds = permissions.roleIds;
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

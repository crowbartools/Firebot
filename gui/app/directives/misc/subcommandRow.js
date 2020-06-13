"use strict";

(function() {
    angular.module("firebotApp").component("subcommandRow", {
        bindings: {
            subcommand: "=",
            cmdTrigger: "@"
        },
        template: `
      <div style="margin-bottom: 10px">
        <div class="sys-command-row" ng-init="hidePanel = true" ng-click="hidePanel = !hidePanel" ng-class="{'expanded': !hidePanel}">

          <div style="flex-basis: 30%;padding-left: 20px;">{{$ctrl.subcommand.regex ? $ctrl.subcommand.usage : $ctrl.subcommand.arg}}</div>

          <div style="width: 25%">
            <span style="min-width: 51px; display: inline-block;" uib-tooltip="Global cooldown">
                <i class="fal fa-globe"></i> {{$ctrl.subcommand.cooldown.global ? $ctrl.subcommand.cooldown.global + "s" : "-" }}
            </span>
            <span uib-tooltip="User cooldown">
                <i class="fal fa-user"></i> {{$ctrl.subcommand.cooldown.user ? $ctrl.subcommand.cooldown.user + "s" : "-" }}
            </span>
          </div>

          <div style="width: 25%"><span style="text-transform: capitalize;">{{$ctrl.getPermisisonType()}}</span> <tooltip type="info" text="$ctrl.getPermissionTooltip()"></tooltip></div>

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

            <div class="muted" style="font-weight:bold; font-size: 12px;">DESCRIPTION</div>
            <p style="font-size: 18px">{{$ctrl.subcommand.description}}</p>

            <div style="padding-bottom:10px">
              <div class="muted" style="font-weight:bold; font-size: 12px;">USAGE</div>
              <p style="font-size: 15px;font-weight: 600;">{{$ctrl.cmdTrigger}} {{$ctrl.subcommand.usage ? $ctrl.subcommand.usage : $ctrl.subcommand.arg}}</p>
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
              <div>
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 5px;">Restrictions <span class="muted" style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand';">(Permissions, currency costs, and more)</span></h3>
                    <restrictions-list 
                        restriction-data="$ctrl.subcommand.restrictionData"
                        trigger="command">
                    </restrictions-section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        controller: function(viewerRolesService) {
            let $ctrl = this;

            $ctrl.$onInit = function() {};

            $ctrl.getPermisisonType = () => {
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


            /*$ctrl.getPermissionTooltip = (command, isSub) => {
                let type = command.permission ? command.permission.type : "";
                let cmdType = isSub ? "subcommand" : "command";

                let groups, username;
                switch (type) {
                case "group":
                    groups = command.permission.groups;
                    if (groups == null || groups.length < 1) {
                        return `This ${cmdType} is set to Group permissions, but no groups are selected.`;
                    }
                    return `This ${cmdType} is restricted to the groups: ${command.permission.groups.join(
                        ", "
                    )}`;
                case "individual":
                    username = command.permission.username;
                    if (username == null || username === "") {
                        return `This ${cmdType} is set to restrict to an individual but a name has not been provided.`;
                    }
                    return `This ${cmdType} is restricted to the user: ${username}`;
                default:
                    if (isSub) {
                        return `This ${cmdType} will use the permissions of the base command.`;
                    }
                    return `This ${cmdType} is available to everyone`;
                }
            };*/
        }
    });
}());

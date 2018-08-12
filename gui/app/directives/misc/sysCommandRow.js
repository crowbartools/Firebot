"use strict";

(function() {
    angular.module("firebotApp").component("sysCommandRow", {
        bindings: {
            command: "<"
        },
        template: `
      <div style="margin-bottom: 20px">
        <div class="sys-command-row" ng-init="hidePanel = true" ng-click="hidePanel = !hidePanel" ng-class="{'expanded': !hidePanel}">
          <div style="flex-basis: 25%;padding-left: 20px;">{{$ctrl.command.name}}</div>
          <div style="width: 20%">{{$ctrl.command.trigger}}</div>
          <div style="width: 20%">
            <span style="min-width: 51px; display: inline-block;" uib-tooltip="Global cooldown">
                <i class="far fa-globe-americas"></i> {{$ctrl.command.cooldown.global ? $ctrl.command.cooldown.global + "s" : "-" }}
            </span>
            <span uib-tooltip="User cooldown">
                <i class="far fa-user"></i> {{$ctrl.command.cooldown.user ? $ctrl.command.cooldown.user + "s" : "-" }}
            </span>
          </div>
          <div style="width: 20%"><span style="text-transform: capitalize;">{{$ctrl.command.permission.type}}</span> <tooltip type="info" text="$ctrl.getPermissionTooltip($ctrl.command)"></tooltip></div>
          <div style="width: 20%">
            <div style="min-width: 75px">
                <span class="status-dot" ng-class="{'active': $ctrl.command.active, 'notactive': !$ctrl.command.active}"></span> {{$ctrl.command.active ? "Active" : "Disabled"}}
            </div> 
          </div>
          <div style="flex-basis:30px; flex-shrink: 0;">
            <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
          </div>
        </div>
        <div uib-collapse="hidePanel" class="sys-command-expanded">
          <div style="padding: 15px 20px 10px 20px;">
            <div class="muted" style="font-weight:bold; font-size: 12px;">DESCRIPTION</div>
            <p style="font-size: 18px">{{$ctrl.command.description}}</p>
            <div>
              <div class="muted" style="font-weight:bold; font-size: 12px;">USAGE</div>
              <p style="font-size: 15px;font-weight: 600;">{{$ctrl.command.trigger}} {{$ctrl.command.usage ? $ctrl.command.usage : ''}}</p>
            </div>
            <p class="muted" ng-if="$ctrl.command.usage">{{$ctrl.command.trigger}} {{$ctrl.command.usage}}</p>
            <div style="padding-top: 5px;" ng-if="$ctrl.command.subCommands && $ctrl.command.subCommands.length > 0">
              <div class="muted" style="font-weight:bold; font-size: 12px;">SUBCOMMANDS</div>
              <div ng-repeat="subCmd in $ctrl.command.subCommands track by $index" style="padding-top: 5px; padding-bottom: 15px;">
                <span style="font-weight: 600;">{{$ctrl.command.trigger}} {{subCmd.usage}}</span>  —  <span style="font-size: 13px;">{{subCmd.description}}</span>
                <div style="padding-left:15px;">
                <div style="display: inline-block; margin-right: 25px;">
                  <div><span class="muted" style="font-size: 10px;"><i class="fas fa-lock-alt"></i> COOLDOWNS</span></div>
                    <div>
                      <span style="min-width: 51px; display: inline-block;" uib-tooltip="Global cooldown">
                          <i class="fal fa-globe"></i> {{$ctrl.command.cooldown.global ? $ctrl.command.cooldown.global + "s" : "-" }}
                      </span>
                      <span uib-tooltip="User cooldown">
                          <i class="fal fa-user"></i> {{$ctrl.command.cooldown.user ? $ctrl.command.cooldown.user + "s" : "-" }}
                      </span>
                    </div>
                  </div>
                  <div style="display: inline-block;">
                    <div><span class="muted" style="font-size: 10px;"><i class="fas fa-lock-alt"></i> PERMISSIONS</span></div>
                    <div><span style="text-transform: capitalize;">{{subCmd.permission.type}}</span> <tooltip type="info" text="$ctrl.getPermissionTooltip(subCmd, true)"></tooltip></div>
                  </div>
                </div>                
              </div>
            </div>
            <div style="padding-top: 10px">
              <button class="btn btn-primary" ng-click="$ctrl.openEditSystemCommandModal()">Edit</button>
            </div>  
          </div>
        </div>
      </div>
    `,
        controller: function(utilityService, commandsService, listenerService) {
            let $ctrl = this;

            $ctrl.$onInit = function() {};

            $ctrl.getPermissionTooltip = (command, isSub) => {
                let type = command.permission ? command.permission.type : "";
                let cmdType = isSub ? "subcommand" : "command";
                switch (type) {
                case "group": {
                    let groups = command.permission.groups;
                    if (groups == null || groups.length < 1) {
                        return `This ${cmdType} is set to Group permissions, but no groups are selected.`;
                    }
                    return `This ${cmdType} is restricted to the groups: ${command.permission.groups.join(
                        ", "
                    )}`;
                }
                case "individual": {
                    let username = command.permission.username;
                    if (username == null || username === "") {
                        return `This ${cmdType} is set to restrict to an individual but a name has not been provided.`;
                    }
                    return `This ${cmdType} is restricted to the user: ${username}`;
                }
                default:
                    if (isSub) {
                        return `This ${cmdType} will use the permissions of the root command.`;
                    }
                    return `This ${cmdType} is available to everyone`;
                }
            };

            $ctrl.openEditSystemCommandModal = function() {
                let cmd = $ctrl.command;

                utilityService.showModal({
                    component: "editSystemCommandModal",
                    resolveObj: {
                        command: () => cmd
                    },
                    closeCallback: resp => {
                        let action = resp.action;
                        if (action === "save") {
                            commandsService.saveSystemCommandOverride(resp.command);
                        } else if (action === "reset") {
                            listenerService.fireEvent("removeSystemCommandOverride", cmd.id);
                        }
                    }
                });
            };
        }
    });
}());

"use strict";
(function() {
    const { v4: uuid } = require("uuid");
    angular.module("firebotApp").component("simpleCommandOptions", {
        bindings: {
            command: "="
        },
        template: `
        <div class="simple-command p-4">
            <div class="form-group">
                <label for="trigger" class="form-label"><i class="fad fa-exclamation"></i> Trigger <tooltip styles="opacity:0.7;font-size:11px;" text="'The text at the beginning of a chat message that should trigger this command. Usually starts with a special character such as !'"/></label>
                <input type="text" class="form-control input-lg" id="trigger" placeholder="!something" ng-model="$ctrl.command.trigger" />
            </div>

            <div class="form-group">
                <label class="form-label"><i class="fad fa-stopwatch"></i> Cooldowns <tooltip styles="opacity:0.7;font-size:11px;" text="'Cooldowns prevent your commands from being spammed. You can apply a cooldown globally and even per user.'"/></label>
                <command-cooldown-settings command="$ctrl.command" message-setting-disabled="true"></command-cooldown-settings>
                <p class="help-block">Optional</p>
            </div>

            <div class="form-group">
                <label class="form-label"><i class="fad fa-lock-alt"></i> Permissions <tooltip styles="opacity:0.7;font-size:11px;" text="'Permissions let you restrict who is able to trigger this command.'" /></label>
                <div>
                    <div class="btn-group">
                        <label class="btn btn-default btn-lg" ng-model="$ctrl.selectedPermissionType" ng-change="$ctrl.permissionTypeChanged()" uib-btn-radio="'everyone'">Everyone</label>
                        <label class="btn btn-default btn-lg" ng-model="$ctrl.selectedPermissionType" ng-change="$ctrl.permissionTypeChanged()" uib-btn-radio="'subs'">Subs Only</label>
                        <label class="btn btn-default btn-lg" ng-model="$ctrl.selectedPermissionType" ng-change="$ctrl.permissionTypeChanged()" uib-btn-radio="'mods'">Mods Only</label>
                    </div>
                </div>
                <p class="help-block">{{$ctrl.getPermissionText()}}</p>
            </div>

            <div class="form-group">
                <label class="form-label"><i class="fad fa-reply"></i> Response Text <tooltip styles="opacity:0.7;font-size:11px;" text="'This is what Firebot should say in response when this command is triggered.'" /></label>
                <textarea ng-model="$ctrl.chatEffect.message" class="form-control" style="font-size: 17px;" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
                <p class="help-block">Want to do more than respond with a message? Switch to <b>Advanced Mode</b> to take full advantage of Firebot's Effect system!</p>
            </div>
        </div>
       `,
        controller: function() {
            const $ctrl = this;

            $ctrl.selectedPermissionType = "everyone";

            $ctrl.getPermissionText = () => {
                switch ($ctrl.selectedPermissionType) {
                    case "everyone":
                        return "All viewers can trigger this command.";
                    case "subs":
                        return "Only your subscribers (and mods) can trigger this command.";
                    case "mods":
                        return "Only your moderators and yourself can trigger this command.";
                }
            };

            $ctrl.permissionTypeChanged = () => {
                switch ($ctrl.selectedPermissionType) {
                    case "everyone":
                        $ctrl.command.restrictionData.restrictions = [];
                        break;
                    case "subs":
                        $ctrl.command.restrictionData.restrictions = [{
                            id: uuid(),
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: ["sub", "mod", "broadcaster"]
                        }];
                        break;
                    case "mods":
                        $ctrl.command.restrictionData.restrictions = [{
                            id: uuid(),
                            type: "firebot:permissions",
                            mode: "roles",
                            roleIds: ["mod", "broadcaster"]
                        }];
                        break;
                }
            };

            $ctrl.$onInit = () => {
                if ($ctrl.command.restrictionData) {
                    const permissions = $ctrl.command.restrictionData.restrictions
                        .find(r => r.type === "firebot:permissions");
                    if (permissions && permissions.roleIds) {
                        if (permissions.roleIds.length === 2 &&
                            permissions.roleIds.includes("mod") &&
                            permissions.roleIds.includes("broadcaster")) {
                            $ctrl.selectedPermissionType = "mods";
                        }
                        if (permissions.roleIds.length === 3 &&
                            permissions.roleIds.includes("sub") &&
                            permissions.roleIds.includes("mod") &&
                            permissions.roleIds.includes("broadcaster")) {
                            $ctrl.selectedPermissionType = "subs";
                        }
                    }
                }
                $ctrl.permissionTypeChanged();

                if ($ctrl.command.effects && $ctrl.command.effects.list) {
                    const chatEffect = $ctrl.command.effects.list.find(e => e.type === "firebot:chat");
                    if (chatEffect) {
                        $ctrl.chatEffect = {
                            id: uuid(),
                            type: "firebot:chat",
                            message: chatEffect.message
                        };
                    }
                }
                if ($ctrl.chatEffect == null) {
                    $ctrl.chatEffect = {
                        id: uuid(),
                        type: "firebot:chat",
                        message: ""
                    };
                }
                $ctrl.command.effects.list = [$ctrl.chatEffect];
            };
        }
    });
}());
"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("commandCooldownSettings", {
            bindings: {
                command: "=",
                messageSettingDisabled: "<?",
                disabled: "<?"
            },
            template: `
                <div class="input-group pb-0">
                    <span class="input-group-addon">Global</span>
                    <input
                        class="form-control"
                        type="number"
                        min="0"
                        placeholder="secs"
                        ng-disabled="$ctrl.disabled"
                        ng-model="$ctrl.command.cooldown.global"
                    />
                    <span class="input-group-addon">User</span>
                    <input
                        class="form-control"
                        type="number"
                        min="0"
                        placeholder="secs"
                        ng-disabled="$ctrl.disabled"
                        ng-model="$ctrl.command.cooldown.user"
                    />
                </div>

                <div
                    class="mt-8 ml-3.5"
                    ng-show="!$ctrl.messageSettingDisabled && ($ctrl.command.cooldown.global > 0 || $ctrl.command.cooldown.user > 0)"
                >
                    <label class="control-fb control--checkbox">
                        Send chat message when on cooldown
                        <input
                            type="checkbox"
                            ng-model="$ctrl.command.sendCooldownMessage"
                        />
                        <div class="control__indicator"></div>
                    </label>

                    <div ng-show="$ctrl.command.sendCooldownMessage">
                        <label class="control-fb control--checkbox">
                            Use custom cooldown message
                            <input
                                type="checkbox"
                                ng-model="$ctrl.command.useCustomCooldownMessage"
                            />
                            <div class="control__indicator"></div>
                        </label>

                        <div ng-if="$ctrl.command.useCustomCooldownMessage">
                            <firebot-input
                                model="$ctrl.command.cooldownMessage"
                                disable-variables="true"
                                input-title="Message"
                        />
                            <p class="muted">Available variables: {user}, {timeLeft}</p>
                        </div>
                    </div>
                </div>
            `
        });
}());

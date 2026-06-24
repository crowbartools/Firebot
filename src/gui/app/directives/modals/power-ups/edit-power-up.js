"use strict";

(function() {
    angular.module("firebotApp")
        .component("editPowerUp", {
            template: `
                <scroll-sentinel element-class="edit-power-up-header"></scroll-sentinel>
                <div class="modal-header sticky-header edit-power-up-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Power-up</h4>
                </div>
                <div class="modal-body" style="padding-top: 15px;">
                    <div style="display: flex; flex-direction: column; padding-left: 15px; padding-right: 15px;">
                        <div style="font-size:30px;margin: 0 auto;">{{$ctrl.powerUp.twitchData.title}}</div>

                        <div style="margin: 10px auto; padding: 12.5px; border-radius: 6px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center;" ng-style="{background: $ctrl.powerUp.twitchData.backgroundColor}">
                            <img
                                ng-src="{{$ctrl.powerUp.twitchData.image ? $ctrl.powerUp.twitchData.image.url4x : $ctrl.powerUp.twitchData.defaultImage.url4x}}"
                                style="width: 75px; height: 75px; display: block;"
                            />
                        </div>

                        <div style="text-align: center; margin-bottom: 5px;">
                            <span class="muted" style="font-size: 14px;">Cost:</span>
                            <strong style="font-size: 18px; margin-left: 5px;">{{$ctrl.powerUp.twitchData.bits}} Bits</strong>
                        </div>

                        <p class="help-block" style="text-align: center; color: #b1adad;" ng-if="$ctrl.powerUp.twitchData.prompt">
                            {{$ctrl.powerUp.twitchData.prompt}}
                        </p>

                        <div class="alert alert-info" style="margin-top: 10px;">
                            <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                            Power-ups are created on Twitch and cannot be edited from Firebot. You can however set up effects to run when this Power-up is redeemed.
                        </div>
                    </div>

                    <div style="padding-left: 15px; padding-right: 15px;">
                        <effect-list
                            effects="$ctrl.powerUp.effects"
                            trigger="power_up"
                            trigger-meta="{ rootEffects: $ctrl.powerUp.effects }"
                            update="$ctrl.effectListUpdated(effects)"
                        ></effect-list>
                    </div>

                </div>
                <div class="modal-footer sticky-footer edit-power-up-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
                <scroll-sentinel element-class="edit-power-up-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(ngToast, powerUpsService) {
                const $ctrl = this;

                /**
                 * @type {import("../../../../../types").SavedPowerUp}
                 */
                $ctrl.powerUp = null;

                $ctrl.effectListUpdated = function(effects) {
                    $ctrl.powerUp.effects = effects;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.powerUp != null) {
                        $ctrl.powerUp = JSON.parse(angular.toJson($ctrl.resolve.powerUp));
                    }
                };

                $ctrl.save = () => {
                    if ($ctrl.powerUp == null) {
                        return;
                    }

                    powerUpsService.savePowerUp($ctrl.powerUp).then((successful) => {
                        if (successful) {
                            $ctrl.dismiss();
                        } else {
                            ngToast.create("Failed to save power-up. Please try again or view logs for details.");
                        }
                    });
                };
            }
        });
}());

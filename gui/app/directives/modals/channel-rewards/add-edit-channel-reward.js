"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditChannelReward", {
            template: `
                <scroll-sentinel element-class="edit-reward-header"></scroll-sentinel>
                <div class="modal-header sticky-header edit-reward-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Channel Reward</h4>
                </div>
                <div class="modal-body" style="padding-top: 15px;">
                    <div ng-if="!$ctrl.reward.manageable">
                        <label class="control-label" style="opacity:0.85;">Reward Name</label>
                        <div style="font-size:16px;">{{$ctrl.reward.twitchData.title}}</div>
                        <p class="muted">This reward was created outside of Firebot so it's settings cannot be changed here. You can however still create effects for it. If you want to update settings for this Reward, you can do so on Twitch.</p>
                    </div>
                    <form ng-show="$ctrl.reward.manageable" name="rewardSettings">
                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('name')}">
                            <label for="name" class="control-label">Reward Name</label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                ng-maxlength="45"
                                required 
                                class="form-control input-lg" 
                                placeholder="Give your reward a name" 
                                ng-model="$ctrl.reward.twitchData.title" 
                            />
                        </div>

                        <div class="form-group">
                            <label for="description" class="control-label">Description</label>
                            <textarea 
                                id="description" 
                                maxlength="200" 
                                ng-model="$ctrl.reward.twitchData.prompt" 
                                class="form-control" 
                                style="font-size: 16px;" 
                                name="text" 
                                placeholder="Add a blurb of what you want your viewer to request" 
                                rows="4" 
                                cols="40"
                            />
                            <p class="help-block">Optional</p>
                        </div>

                        <div class="form-group flex-row jspacebetween">
                            <div>
                                <label class="control-label" style="margin:0;">Require Viewer to Enter Text</label>
                                <p class="help-block">If enabled, a required text field will appear to viewers in the reward.</p>
                            </div>
                            <div>
                                <toggle-button toggle-model="$ctrl.reward.twitchData.isUserInputRequired" auto-update-value="true" font-size="32"></toggle-button>
                            </div>
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('cost')}">
                            <label for="cost" class="control-label">Cost</label>
                            <input 
                                type="number" 
                                class="form-control input-lg" 
                                id="cost" 
                                name="cost"
                                placeholder="Enter amount" 
                                ng-model="$ctrl.reward.twitchData.cost"
                                required
                                min="0" 
                                style="width: 50%;" 
                            />
                            <p class="help-block">Tip: Viewers earn 220 points per hour on average. Subs earn multipliers up to 2x.</p>
                        </div>

                        <div class="form-group">
                            <label class="control-label">Background Color</label>
                            <div style="margin-top:10px; width: 50%;">
                                <color-picker-input model="$ctrl.reward.twitchData.backgroundColor" lg-input="true" show-clear="false"></color-picker-input>
                            </div>
                        </div>

                        <div class="form-group flex-row jspacebetween">
                            <div>
                                <label class="control-label" style="margin:0;">Skip Reward Requests Queue</label>
                                <p class="help-block">If enabled, only future viewer requests will skip the queue for review.</p>
                            </div>
                            <div>
                                <toggle-button toggle-model="$ctrl.reward.twitchData.shouldRedemptionsSkipRequestQueue" auto-update-value="true" font-size="32"></toggle-button>
                            </div>
                        </div>

                        <div 
                            style="margin-bottom: 30px;" 
                            ng-class="{'has-error': $ctrl.formFieldHasError('cooldownSeconds')}"
                        >
                            <div class="form-group flex-row jspacebetween" style="margin-bottom: 0;">
                                <div>
                                    <label class="control-label" style="margin:0;">Redemption Cooldown</label>
                                    <p class="help-block">Time between redemptions, up to 7 days</p>
                                </div>
                                <div>
                                    <toggle-button toggle-model="$ctrl.reward.twitchData.globalCooldownSetting.isEnabled" auto-update-value="true" font-size="32"></toggle-button>
                                </div>
                            </div>
                            <div style="width: 50%;">
                                <time-input
                                    ng-model="$ctrl.reward.twitchData.globalCooldownSetting.globalCooldownSeconds"
                                    name="cooldownSeconds"
                                    ui-validate="'!$ctrl.reward.twitchData.globalCooldownSetting.isEnabled || ($value != null && $value > -1 && $value <= 604800)'"
                                    ui-validate-watch="'$ctrl.reward.twitchData.globalCooldownSetting.isEnabled'" 
                                    large="true"
                                    disabled="!$ctrl.reward.twitchData.globalCooldownSetting.isEnabled"
                                />
                            </div>
                        </div>

                        <div 
                            style="margin-bottom: 30px;"
                            ng-class="{'has-error': $ctrl.formFieldHasError('maxPerStream')}"
                        >
                            <div 
                                class="form-group flex-row jspacebetween" 
                                style="margin-bottom: 0;"
                            >
                                <div>
                                    <label class="control-label" style="margin:0;">Limit Redemptions Per Stream</label>
                                    <p class="help-block">Max total redemptions for viewers</p>
                                </div>
                                <div>
                                    <toggle-button toggle-model="$ctrl.reward.twitchData.maxPerStreamSetting.isEnabled" auto-update-value="true" font-size="32"></toggle-button>
                                </div>
                            </div>
                            <input 
                                type="number"
                                class="form-control input-lg" 
                                name="maxPerStream"
                                placeholder="Enter amount" 
                                ng-model="$ctrl.reward.twitchData.maxPerStreamSetting.maxPerStream" 
                                ng-disabled="!$ctrl.reward.twitchData.maxPerStreamSetting.isEnabled" 
                                ui-validate="'!$ctrl.reward.twitchData.maxPerStreamSetting.isEnabled || ($value != null && $value > -1)'"
                                ui-validate-watch="'$ctrl.reward.twitchData.maxPerStreamSetting.isEnabled'" 
                                style="width: 50%;"
                            />
                        </div>

                        <div 
                            style="margin-bottom: 30px;"
                            ng-class="{'has-error': $ctrl.formFieldHasError('maxPerUserPerStream') }"
                        >
                            <div 
                                class="form-group flex-row jspacebetween" 
                                style="margin-bottom: 0;" 
                            >
                                <div>
                                    <label class="control-label" style="margin:0;">Limit Redemptions Per User Per Stream</label>
                                    <p class="help-block">Max individual redemptions per viewer per stream</p>
                                </div>
                                <div>
                                    <toggle-button toggle-model="$ctrl.reward.twitchData.maxPerUserPerStreamSetting.isEnabled" auto-update-value="true" font-size="32"></toggle-button>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                class="form-control input-lg" 
                                name="maxPerUserPerStream" 
                                placeholder="Enter amount" 
                                ng-model="$ctrl.reward.twitchData.maxPerUserPerStreamSetting.maxPerUserPerStream" 
                                ng-disabled="!$ctrl.reward.twitchData.maxPerUserPerStreamSetting.isEnabled"
                                ui-validate="'!$ctrl.reward.twitchData.maxPerUserPerStreamSetting.isEnabled || ($value != null && $value > -1)'"
                                ui-validate-watch="'$ctrl.reward.twitchData.maxPerUserPerStreamSetting.isEnabled'" 
                                style="width: 50%;" 
                            />
                        </div>
                    </form>

                    <div style="margin-top:15px;">
                        <effect-list effects="$ctrl.reward.effects" trigger="reward" update="$ctrl.effectListUpdated(effects)"></effect-list>
                    </div>

                </div>
                <div class="modal-footer sticky-footer edit-reward-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
                <scroll-sentinel element-class="edit-reward-footer"></scroll-sentinel>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope) {
                const $ctrl = this;

                const generateRandomColor = () => `#${Math.floor(Math.random() * 8 ** 8).toString(16)}`;

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.rewardSettings.$submitted || $scope.rewardSettings[fieldName].$touched)
                        && $scope.rewardSettings[fieldName].$invalid;
                };

                $ctrl.validationErrors = {};

                $ctrl.isNewReward = true;

                /**
                 * @type {import('../../../../../backend/channel-rewards/channel-reward-manager').SavedChannelReward}
                 */
                $ctrl.reward = {
                    id: null,
                    twitchData: {
                        id: null,
                        title: "",
                        prompt: "",
                        isEnabled: true,
                        isPaused: false,
                        isUserInputRequired: false,
                        shouldRedemptionsSkipRequestQueue: true,
                        cost: null,
                        backgroundColor: generateRandomColor(),
                        globalCooldownSetting: {
                            isEnabled: false,
                            globalCooldownSeconds: null
                        },
                        maxPerStreamSetting: {
                            isEnabled: false,
                            maxPerStream: null
                        },
                        maxPerUserPerStreamSetting: {
                            isEnabled: false,
                            maxPerUserPerStream: null
                        }
                    },
                    manageable: true,
                    sortTags: [],
                    effects: null
                };

                $ctrl.effectListUpdated = function(effects) {
                    $ctrl.reward.effects = effects;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.reward != null) {
                        $ctrl.reward = JSON.parse(angular.toJson($ctrl.resolve.reward));
                        $ctrl.isNewReward = false;
                    }
                };

                $ctrl.save = () => {
                    $scope.rewardSettings.$setSubmitted();
                    if ($scope.rewardSettings.$invalid) {
                        return;
                    }
                    console.log("VALID FORM");
                };
            }
        });
}());

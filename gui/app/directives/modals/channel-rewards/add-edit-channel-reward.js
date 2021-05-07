"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditChannelReward", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Channel Reward</h4>
                </div>
                <div class="modal-body" style="padding-top: 15px;">

                    <div class="form-group">
                        <label for="name" class="form-label">Reward Name</label>
                        <input type="text" class="form-control input-lg" id="name" placeholder="Give your reward a name" ng-model="$ctrl.reward.twitchData.title" />
                    </div>

                    <div class="form-group">
                        <label for="description" class="form-label">Description</label>
                        <textarea id="description" ng-model="$ctrl.reward.twitchData.prompt" class="form-control" style="font-size: 16px;" name="text" placeholder="Add a blurb of what you want your viewer to request" rows="4" cols="40"></textarea>
                        <p class="help-block">Optional</p>
                    </div>

                    <div class="form-group flex-row jspacebetween">
                        <div>
                            <label class="form-label" style="margin:0;">Require Viewer to Enter Text</label>
                            <p class="help-block">If enabled, a required text field will appear to viewers in the reward.</p>
                        </div>
                        <div>
                            <toggle-button toggle-model="$ctrl.reward.twitchData.isUserInputRequired" auto-update-value="true" font-size="32"></toggle-button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="cost" class="form-label">Cost</label>
                        <input type="number" class="form-control input-lg" id="cost" placeholder="Enter amount" ng-model="$ctrl.reward.twitchData.cost" style="width: 50%;" />
                        <p class="help-block">Tip: Viewers earn 220 points per hour on average. Subs earn multipliers up to 2x.</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Background Color</label>
                        <color-picker-input style="margin-top:10px" model="$ctrl.reward.twitchData.backgroundColor"></color-picker-input>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                const generateRandomColor = () => `#${Math.floor(Math.random() * 8 ** 8).toString(16)}`;

                $ctrl.isNewReward = true;

                /**
                 * @type {import('../../../../../backend/channel-rewards/channel-reward-manager').SavedChannelReward}
                 */
                $ctrl.reward = {
                    id: null,
                    twitchData: {
                        title: "",
                        prompt: "",
                        isEnabled: true,
                        isPaused: false,
                        isUserInputRequired: false,
                        cost: null,
                        backgroundColor: generateRandomColor()

                    },
                    manageable: true,
                    sortTags: []
                };

                $ctrl.$onInit = () => {
                    // When the component is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };

                $ctrl.save = () => {

                };
            }
        });
}());

"use strict";
(function () {
    angular
        .module("firebotApp")
        .controller("channelRewardsController", function (
            $scope,
            channelRewardsService,
            utilityService,
            accountAccess,
            ngToast
        ) {
            $scope.channelRewardsService = channelRewardsService;

            $scope.canUseChannelRewards = () => accountAccess.accounts["streamer"].loggedIn
                && channelRewardsService.userIsEligible;

            // triggering twitch sync
            channelRewardsService.syncChannelRewards();

            $scope.saveChannelReward = (reward) => {
                channelRewardsService.saveChannelReward(reward);
            };

            $scope.onRewardsUpdated = (items) => {
                channelRewardsService.saveAllRewards(items);
            };

            $scope.rewardHeaders = [
                {
                    headerStyles: {
                        'width': '50px'
                    },
                    cellTemplate: `
                        <div style="width: 30px; height: 30px; border-radius: 5px; padding: 5px; background-color: {{data.twitchData.backgroundColor}};">
                            <img ng-src="{{data.twitchData.image ? data.twitchData.image.url1x : data.twitchData.defaultImage.url1x}}"  style="width: 100%;filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.50));"/>
                        </div>
                    `,
                    cellController: () => { }
                },
                {
                    name: "NAME",
                    icon: "fa-user",
                    headerStyles: {
                        'min-width': '125px'
                    },
                    dataField: "twitchData.title",
                    sortable: true,
                    cellTemplate: `{{data.twitchData.title}} <i ng-hide="data.manageable" class="fas fa-lock muted" style="font-size: 12px;" uib-tooltip="This reward was created either outside of Firebot or in an older version. Its settings cannot be changed in Firebot." />`,
                    cellController: () => { }
                },
                {
                    name: "COST",
                    icon: "fa-coin",
                    dataField: "twitchData.cost",
                    sortable: true,
                    cellTemplate: `{{data.twitchData.cost}}`,
                    cellController: () => { }
                },
                {
                    cellTemplate: `
                        <span ng-if="data.deletedOnTwitch">
                            <i class="fas fa-cloud-slash muted" style="margin-right: 5px"></i>Disabled (Not on Twitch)
                        </span>
                        <span ng-if="!data.deletedOnTwitch">
                            <span class="paused-dot" style="margin-right: 5px" ng-class="{'paused': data.twitchData.isPaused, 'unpaused': !data.twitchData.isPaused}"></span>{{data.twitchData.isPaused ? 'Paused' : 'Unpaused' }}
                        </span>
                    `,
                    cellController: () => { }
                }
            ];


            $scope.rewardMenuOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> ${item.manageable ? "Edit" : "Edit Effects"}</a>`,
                        click: function () {
                            channelRewardsService.showAddOrEditRewardModal(item);
                        }
                    },
                    {
                        html: `<a href uib-tooltip="${!item.manageable ? 'This reward was created either outside of Firebot or in an older version. Its enabled status cannot be edited.' : (item.twitchData.isEnabled ? 'Disabling will delete the reward from Twitch to free up a slot. Your configuration is preserved locally.' : 'Enabling will recreate the reward on Twitch.')}" tooltip-enable="${!item.manageable || item.manageable}"><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${item.deletedOnTwitch ? "Enable Channel Reward" : (item.twitchData.isEnabled ? "Disable Channel Reward" : "Enable Channel Reward")}</a>`,
                        click: function () {
                            if (item.deletedOnTwitch && channelRewardsService.getActiveRewardCount() >= 50) {
                                ngToast.create("Cannot re-enable: Twitch's 50 reward limit has been reached.");
                                return;
                            }
                            item.twitchData.isEnabled = !item.twitchData.isEnabled;
                            channelRewardsService.saveChannelReward(item);
                        },
                        compile: true,
                        enabled: item.manageable
                    },
                    {
                        html: `<a href uib-tooltip="This reward was created either outside of Firebot or in an older version. Its paused status cannot be edited." tooltip-enable="${!item.manageable}"><i class="far fa-toggle-off" style="margin-right: 10px;"></i> ${item.twitchData.isPaused ? "Unpause Channel Reward" : "Pause Channel Reward"}</a>`,
                        click: function () {
                            item.twitchData.isPaused = !item.twitchData.isPaused;
                            channelRewardsService.saveChannelReward(item);
                        },
                        compile: true,
                        enabled: item.manageable && !item.deletedOnTwitch
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            channelRewardsService.duplicateChannelReward(item.firebotId);
                        },
                        enabled: channelRewardsService.getActiveRewardCount() < 50
                    },
                    {
                        html: `<a href style="${item.manageable ? 'color: #fb7373;' : ''}" uib-tooltip="This reward was created either outside of Firebot or in an older version. It cannot be deleted from here." tooltip-enable="${!item.manageable}"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Channel Reward",
                                    question: `Are you sure you want to delete the Channel Reward "${item.twitchData.title}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        channelRewardsService.deleteChannelReward(item.firebotId);
                                    }
                                });

                        },
                        compile: true,
                        enabled: item.manageable
                    }
                ];

                return options;
            };
        });
}());
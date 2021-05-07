"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("channelRewardsController", function(
            $scope,
            channelRewardsService
        ) {
            $scope.channelRewardsService = channelRewardsService;

            $scope.onRewardsUpdated = (items) => {
                channelRewardsService.saveAllRewards(items);
            };

            $scope.testRewardTriggered = itemId => {
                console.log("test trigger", itemId);
            };

            $scope.headers = [
                {
                    headerStyles: {
                        'width': '50px'
                    },
                    cellTemplate: `
                        <div style="width: 30px; height: 30px; border-radius: 5px; padding: 5px; background-color: {{data.twitchData.backgroundColor}};">
                            <img ng-src="{{data.twitchData.image ? data.twitchData.image.url1x : data.twitchData.defaultImage.url1x}}"  style="width: 100%;filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.50));"/>
                        </div>
                    `,
                    cellController: () => {}
                },
                {
                    name: "NAME",
                    icon: "fa-user",
                    headerStyles: {
                        'min-width': '125px'
                    },
                    cellTemplate: `{{data.twitchData.title}} <i ng-hide="data.manageable" class="fas fa-lock muted" style="font-size: 12px;" />`,
                    cellController: () => {}
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
                        html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                        click: function () {
                            //$scope.toggleCustomCommandActiveState(command);
                        },
                        enabled: item.manageable
                    },
                    // {
                    //     html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                    //     click: function ($itemScope) {
                    //         //$scope.duplicateCustomCommand(command);
                    //     },
                    //     enabled: item.manageable
                    // },
                    {
                        html: `<a href style="${item.manageable ? 'color: #fb7373;' : ''}"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            //$scope.deleteCustomCommand(command);
                        },
                        enabled: item.manageable
                    }
                ];

                return options;
            };
        });
}());

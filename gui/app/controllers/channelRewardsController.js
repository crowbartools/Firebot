"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("channelRewardsController", function(
            $scope,
            channelRewardsService,
            filterFilter,
            sortTagSearchFilter
        ) {
            $scope.channelRewardsService = channelRewardsService;

            $scope.selectedSortTag = null;
            $scope.searchQuery = "";


            function filterRewards() {
                return filterFilter(sortTagSearchFilter(channelRewardsService.channelRewards, channelRewardsService.selectedSortTag), channelRewardsService.searchQuery);
            }

            $scope.filteredRewards = filterRewards();

            $scope.$watchGroup(
                [
                    'channelRewardsService.selectedSortTag',
                    'channelRewardsService.searchQuery',
                    'channelRewardsService.channelRewards'
                ],
                function (_newVal, _oldVal, scope) {
                    scope.filteredRewards = filterRewards();
                },
                true);

            $scope.manuallyTriggerReward = id => {

            };



            $scope.sortableOptions = {
                handle: ".dragHandle",
                'ui-preserve-size': true,
                stop: () => {
                    // if (commandsService.selectedSortTag != null &&
                    //     (commandsService.customCommandSearch == null ||
                    //         commandsService.customCommandSearch.length < 1)) return;
                    // commandsService.saveAllCustomCommands($scope.filteredCommands);
                }
            };

            $scope.rewardMenuOptions = (reward) => {
                return [];
                // const options = [
                //     {
                //         html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                //         click: function ($itemScope) {
                //             let command = $itemScope.command;
                //             $scope.openAddOrEditCustomCommandModal(command);
                //         }
                //     },
                //     {
                //         html: `<a href ><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                //         click: function ($itemScope) {
                //             let command = $itemScope.command;
                //             $scope.toggleCustomCommandActiveState(command);
                //         }
                //     },
                //     {
                //         html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                //         click: function ($itemScope) {
                //             let command = $itemScope.command;
                //             $scope.duplicateCustomCommand(command);
                //         }
                //     },
                //     {
                //         html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                //         click: function ($itemScope) {
                //             let command = $itemScope.command;
                //             $scope.deleteCustomCommand(command);
                //         }
                //     }
                // ];

                // const sortTags = commandsService.getSortTags();

                // if (sortTags.length > 0) {
                //     options.push({
                //         text: "Sort tags...",
                //         children: sortTags.map(st => {
                //             const isSelected = command.sortTags && command.sortTags.includes(st.id);
                //             return {
                //                 html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${st.name}</a>`,
                //                 click: () => {
                //                     $scope.toggleSortTag(command, st.id);
                //                 }
                //             };
                //         }),
                //         hasTopDivider: true
                //     });
                // }

                // return options;
            };
        });
}());

"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("databaseSettings", {
            template: `
                <div>

                    <firebot-setting
                        name="Viewer Database"
                        description="Turn on/off the viewer tracking database. This could improve performance in some cases."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="viewerDb = settings.getViewerDB()"
                            selected="viewerDb"
                            on-update="settings.setViewerDB(option === 'true')"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Auto Flag Bots"
                        description="Prevents known bots from generating stats or showing up in active viewer lists."
                    >
                        <firebot-select
                            options="{ true: 'On', false: 'Off' }"
                            ng-init="autoFlagBots = settings.getAutoFlagBots()"
                            selected="autoFlagBots"
                            on-update="settings.setAutoFlagBots(option === 'true')"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Viewers Table Page Size"
                        description="Select how many viewers are displayed per page for the Viewers table."
                    >
                        <firebot-select
                            options="[5,10,15,20,25,30,35,40,45,50,55,60]"
                            ng-init="viewerListPageSize = settings.getViewerListPageSize()"
                            selected="viewerListPageSize"
                            on-update="settings.setViewerListPageSize(option)"
                            right-justify="true"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Purge Viewer Data"
                        description="Sometimes you may want to periodically purge viewer data to clear out inactive viewers."
                    >
                        <firebot-button
                            text="View Purge Options"
                            ng-click="showPurgeViewersModal()"
                        />
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService, utilityService) {
                $scope.settings = settingsService;

                $scope.showPurgeViewersModal = () => {
                    utilityService.showModal({
                        component: "purgeViewersModal",
                        size: 'sm',
                        backdrop: false,
                        keyboard: true
                    });
                };
            }
        });
}());

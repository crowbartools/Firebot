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
                        <toggle-button
                            toggle-model="settings.getSetting('ViewerDB')"
                            on-toggle="settings.saveSetting('ViewerDB', !settings.getSetting('ViewerDB'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Auto Flag Bots"
                        description="Prevents known bots from generating stats or showing up in active viewer lists."
                    >
                        <toggle-button
                            toggle-model="settings.getSetting('AutoFlagBots')"
                            on-toggle="settings.saveSetting('AutoFlagBots', !settings.getSetting('AutoFlagBots'))"
                            font-size="40"
                        />
                    </firebot-setting>

                    <firebot-setting
                        name="Viewers Table Page Size"
                        description="Select how many viewers are displayed per page for the Viewers table."
                    >
                        <firebot-select
                            options="[5,10,15,20,25,30,35,40,45,50,55,60]"
                            ng-init="viewerListPageSize = settings.getSetting('ViewerListPageSize')"
                            selected="viewerListPageSize"
                            on-update="settings.saveSetting('ViewerListPageSize', option)"
                            right-justify="true"
                            aria-label="enable or disable Viewers Table Page Size"
                        />
                    </firebot-setting>

                </div>
          `,
            controller: function($scope, settingsService) {
                $scope.settings = settingsService;
            }
        });
}());

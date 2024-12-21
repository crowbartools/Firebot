"use strict";

(function() {

    const moment = require("moment");

    angular.module("firebotApp")
        .component("streamInfo", {
            bindings: {},
            template: `
                <div ng-if="sis.streamInfo.isLive" class="stream-info-stats-wrapper">
                    <div class="stream-info-stat" ng-show="settings.getSetting('ShowUptimeStat')">
                        <span style="margin-right: 5px; background: red;display: inline-block;width: 12px;height: 12px;border-radius: 15px;"></span>
                        <span>{{sessionTimeDisplay}}</span>
                    </div>

                    <div class="stream-info-stat" ng-show="settings.getSetting('ShowViewerCountStat')" style="margin-left:10px">
                        <i class="fas fa-user" style="margin-right: 5px; font-size: 12px;" />
                        <span>{{sis.streamInfo.viewers}}</span>
                    </div>

                    <hype-train-indicator ng-if="settings.getSetting('ShowHypeTrainIndicator') && hts.hypeTrainActive"></hype-train-indicator>

                    <ad-break-indicator ng-if="settings.getSetting('ShowAdBreakIndicator') && abs.showAdBreakTimer"></ad-break-service>
                </div>
            `,
            controller: function($scope, streamInfoService, settingsService, hypeTrainService, adBreakService, $interval) {
                const $ctrl = this;

                $scope.sis = streamInfoService;
                $scope.hts = hypeTrainService;
                $scope.abs = adBreakService;

                $scope.settings = settingsService;

                let totalSeconds = 0;
                $scope.sessionTimeDisplay = "00:00:00";

                function seedElapsedSeconds() {
                    if (streamInfoService.streamInfo.startedAt == null ||
                        streamInfoService.streamInfo.startedAt === "") {
                        return;
                    }

                    const startedAt = moment(streamInfoService.streamInfo.startedAt);
                    const now = moment();

                    totalSeconds = now.diff(startedAt, "seconds");
                }

                function buildDurationDisplay() {
                    const allSecs = Math.round(totalSeconds);

                    const hours = Math.floor(allSecs / (60 * 60));

                    const divisorForMinutes = allSecs % (60 * 60);
                    const minutes = Math.floor(divisorForMinutes / 60);

                    const divisorForSeconds = divisorForMinutes % 60;
                    const seconds = Math.ceil(divisorForSeconds);

                    const hourDisplay = hours.toString().padStart(2, "0"),
                        minDisplay = minutes.toString().padStart(2, "0"),
                        secDisplay = seconds.toString().padStart(2, "0");

                    $scope.sessionTimeDisplay = `${hourDisplay}:${minDisplay}:${secDisplay}`;
                }

                $scope.$watch("sis.streamInfo.startedAt", () => {
                    seedElapsedSeconds();
                    buildDurationDisplay();
                });

                $ctrl.$onInit = function() {
                    seedElapsedSeconds();
                    buildDurationDisplay();
                };

                $interval(() => {
                    if (!streamInfoService.streamInfo.isLive) {
                        return;
                    }

                    totalSeconds += 1;

                    buildDurationDisplay();
                }, 1000);
            }
        });
}());

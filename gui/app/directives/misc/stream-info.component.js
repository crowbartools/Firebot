"use strict";

(function() {

    const moment = require("moment");

    angular.module("firebotApp")
        .component("streamInfo", {
            bindings: {},
            template: `
                <div ng-if="sis.streamInfo.isLive" style="display: flex; align-items: center; justify-content: center; width: 100%">
                    <div style="background: rgba(0, 0, 0, 0.25);border-radius: 6px;padding: 7px;font-size: 17px;">
                        <span style="background: red;display: inline-block;width: 12px;height: 12px;border-radius: 15px;"></span>
                        <span>{{sessionTimeDisplay}}</span>
                    </div>

                    <div style="display: flex; align-items: center; margin-left: 10px; background: rgba(0, 0, 0, 0.25);border-radius: 6px;padding: 7px;font-size: 17px;">
                        <i class="fas fa-user" style="margin-right: 5px; font-size: 12px;" />
                        <span>{{sis.streamInfo.viewers}}</span>
                    </div>
                </div>
            `,
            controller: function($scope, streamInfoService, $interval) {
                const $ctrl = this;

                $scope.sis = streamInfoService;

                let totalSeconds = 0;
                $scope.sessionTimeDisplay = "00:00:00";

                function seedElapsedSeconds() {
                    if (streamInfoService.streamInfo.startedAt == null ||
                        streamInfoService.streamInfo.startedAt === "") return;

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
                    if (!streamInfoService.streamInfo.isLive) return;

                    totalSeconds += 1;

                    buildDurationDisplay();
                }, 1000);
            }
        });
}());

"use strict";

(function() {

    const moment = require("moment");

    angular.module("firebotApp")
        .component("hypeTrainIndicator", {
            bindings: {},
            template: `
                <div
                    class="stream-info-stat hype-train-indicator"
                    style="margin-left:10px"
                    uib-tooltip="Hype Train in progress"
                    tooltip-append-to-body="true"
                    tooltip-placement="bottom"
                >
                    <i class="fas fa-subway" style="margin-right: 5px; font-size: 12px;" />
                    <span class="level-pill">LVL {{hts.currentLevel}}</span>
                    <span ng-if="hts.isGoldenKappaTrain"
                        class="level-pill golden"
                        uib-tooltip="Congratulations, a Golden Kappa Train is a rare event! Anyone whom cheers 100 bits, subs, re-subs, or gifts a sub during it gains access to the Golden Kappa emote on Twitch for 24 hours."
                        tooltip-append-to-body="true"
                        tooltip-placement="bottom"
                    >Golden Kappa</span>
                    <span ng-if="!hts.hypeTrainEnded" class="pl-2 font-bold">{{hts.currentProgressPercentage}}%</span>
                    <span class="pl-2 time-left">({{!hts.hypeTrainEnded ? timeLeftDisplay : 'Ended'}})</span>
                </div>
            `,
            controller: function($scope, hypeTrainService, $interval) {
                const $ctrl = this;

                $scope.hts = hypeTrainService;

                $scope.timeLeftDisplay = "0:00";

                function updateTimeLeftDisplay() {

                    const endsAt = moment(hypeTrainService.endsAt);
                    const now = moment();

                    if (now.isAfter(endsAt)) {
                        $scope.timeLeftDisplay = "0:00";
                        return;
                    }

                    const secondsLeft = Math.abs(now.diff(endsAt, "seconds"));

                    const allSecs = Math.round(secondsLeft);

                    const divisorForMinutes = allSecs % (60 * 60);
                    const minutes = Math.floor(divisorForMinutes / 60);

                    const divisorForSeconds = divisorForMinutes % 60;
                    const seconds = Math.ceil(divisorForSeconds);

                    const minDisplay = minutes.toString().padStart(1, "0"),
                        secDisplay = seconds.toString().padStart(2, "0");

                    $scope.timeLeftDisplay = `${minDisplay}:${secDisplay}`;
                }

                $ctrl.$onInit = function() {
                    updateTimeLeftDisplay();
                };

                $interval(() => {
                    updateTimeLeftDisplay();
                }, 1000);
            }
        });
}());

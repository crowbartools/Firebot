'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("soundPlayer", {
            bindings: {
                path: "<",
                volume: "<"
            },
            template: `
            <div style="display: flex;flex-direction: row;align-items: center;">

            </div>
            `,
            controller: function($scope, soundService) {
                let $ctrl = this;

                $scope.seekPositionDisplay = "0:00";
                $scope.durationDisplay = "0:00";
                $scope.controlsEnabled = false;

                let sound = null;

                let seekPositionTimer = null;

                function getDurationDisplay(duration) {
                    let totalSecs = Math.round(duration);

                    let display = "";
                    if (totalSecs < 60) {
                        display = `0:${totalSecs}`;
                    } else {
                        let totalMins = totalSecs / 60;
                        let remainingSecs = totalSecs % 60;
                        display = `${totalMins}:${remainingSecs}`;
                    }
                    return display;
                }

                function loadSound() {
                    if ($ctrl.path != null || $ctrl.path.length === 0) {
                        $scope.seekPositionDisplay = "0:00";
                        $scope.durationDisplay = "0:00";
                        $scope.controlsEnabled = false;
                        return;
                    }
                    let volume = 5;
                    if (!isNaN($ctrl.volume)) {
                        volume = $ctrl.volume;
                    }
                    soundService.getHowlSound($ctrl.path, volume)
                        .then(s => {
                            sound = s;

                            sound.on('load', function() {
                                $scope.controlsEnabled = true;
                                $scope.durationDisplay = getDurationDisplay(sound.duration());
                            });

                            sound.load();

                        });
                }


                $ctrl.$onChanges = function (changes) {
                    if (changes.path) {

                    }
                };



                $ctrl.$onInit = function() {

                };
            }
        });
}());

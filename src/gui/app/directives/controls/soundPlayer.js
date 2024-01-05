'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("soundPlayer", {
            bindings: {
                path: "<",
                volume: "<",
                outputDevice: "<"
            },
            template: `
            <div ng-class="{'disabled-control': !$ctrl.path }" class="sound-player noselect">
                <div ng-click="playOrPause()" ng-class="{'disabled-control': !$ctrl.path,  'clickable': $ctrl.path}" style="padding-right: 10px;">
                    <i class="fas" ng-class="{'fa-play': !isPlaying(), 'fa-pause': isPlaying()}"></i>
                </div>
                <div ng-click="stop()" ng-class="{'disabled-control': !$ctrl.path,  'clickable': $ctrl.path}" style="padding-right: 10px;">
                    <i class="fas fa-stop"></i>
                </div>
                <span>
                 {{seekPositionDisplay}} / {{durationDisplay}}
                </span>
            </div>
            `,
            controller: function($scope, $interval, soundService) {
                const $ctrl = this;

                $scope.seekPositionDisplay = "-:--";
                $scope.durationDisplay = "-:--";
                $scope.controlsEnabled = false;

                let sound = null;

                function pad(num) {
                    let s = `${num}`;
                    while (s.length < 2) {
                        s = `0${s}`;
                    }

                    return s;
                }

                function getDurationDisplay(duration) {
                    if (isNaN(duration)) {
                        return "0:00";
                    }
                    const totalSecs = Math.round(duration);

                    let display = "";
                    if (totalSecs < 60) {
                        display = `0:${pad(totalSecs)}`;
                    } else {
                        const totalMins = Math.floor(totalSecs / 60);
                        const remainingSecs = totalSecs % 60;

                        display = `${totalMins}:${pad(remainingSecs)}`;
                    }
                    return display;
                }

                let previousSeek = 0;
                const seekPositionTimer = $interval(() => {
                    if (sound != null) {
                        const currentSeek = sound.seek();
                        if (currentSeek !== previousSeek) {
                            $scope.seekPositionDisplay = getDurationDisplay(currentSeek);
                            previousSeek = currentSeek;
                        }
                    }
                }, 250);


                function loadSound() {
                    if (sound != null) {
                        sound.unload();
                        sound = null;
                    }
                    if ($ctrl.path == null || $ctrl.path.length === 0) {
                        $scope.seekPositionDisplay = "-:--";
                        $scope.durationDisplay = "-:--";
                        $scope.controlsEnabled = false;
                        return;
                    }

                    $scope.seekPositionDisplay = "0:00";

                    let volume = 0.5;
                    if (!isNaN($ctrl.volume)) {
                        volume = $ctrl.volume;
                        if (volume > 10) {
                            volume = 1;
                        } else if (volume > 0) {
                            volume = volume / 10;
                        }
                    }

                    soundService.getHowlSound($ctrl.path, volume, $ctrl.outputDevice)
                        .then(s => {
                            sound = s;

                            sound.on('load', function() {
                                $scope.controlsEnabled = true;
                                $scope.durationDisplay = getDurationDisplay(sound.duration());
                            });

                            sound.load();
                        });
                }

                $scope.isPlaying = () => {
                    if (sound == null) {
                        return false;
                    }

                    return sound.playing();
                };

                $scope.playOrPause = () => {
                    if (sound == null || !$scope.controlsEnabled) {
                        return;
                    }

                    if (sound.playing()) {
                        sound.pause();
                    } else {
                        sound.play();
                    }
                };


                $scope.stop = () => {
                    if (sound == null || !$scope.controlsEnabled) {
                        return;
                    }

                    sound.stop();
                };


                $ctrl.$onChanges = function (changes) {
                    if (changes.path || changes.outputDevice) {
                        loadSound();
                    }
                    if (changes.volume) {
                        if (sound != null) {
                            let newVolume = changes.volume.currentValue;
                            if (!isNaN(newVolume)) {

                                if (newVolume > 10) {
                                    newVolume = 1;
                                } else if (newVolume > 0) {
                                    newVolume = newVolume / 10;
                                }
                                sound.volume(newVolume);
                            }
                        }
                    }
                };

                $ctrl.$onDestroy = function() {
                    $interval.cancel(seekPositionTimer);
                    if (sound != null) {
                        sound.unload();
                    }
                };



                $ctrl.$onInit = function() {
                    loadSound();
                };
            }
        });
}());

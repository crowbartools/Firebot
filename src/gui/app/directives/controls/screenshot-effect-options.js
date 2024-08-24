"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("screenshotEffectOptions", {
            bindings: {
                effect: "="
            },
            template: `
                <div>
                    <eos-container header="Output Options" pad-top="true">
                        <div style="padding-top:15px">
                            <label class="control-fb control--checkbox"> Save to folder
                                <input type="checkbox" ng-model="effect.saveLocally">
                                <div class="control__indicator"></div>
                            </label>
                            <div ng-if="effect.saveLocally" style="margin-left: 30px;">
                                <file-chooser model="effect.folderPath" options="{ directoryOnly: true, filters: [], title: 'Select Screenshot Folder'}"></file-chooser>
                                <firebot-input class="pt-3" model="effect.fileNamePattern" input-title="File Name Pattern" input-type="text" menu-position="bottom" />
                            </div>
                        </div>

                        <div style="padding-top:15px">
                            <label class="control-fb control--checkbox"> Overwrite existing file
                                <input type="checkbox" ng-model="effect.overwriteExisting" ng-change="overwriteExistingChanged()">
                                <div class="control__indicator"></div>
                            </label>
                            <div ng-if="effect.overwriteExisting" style="margin-left: 30px;">
                                <file-chooser model="effect.file" options="{ filters: [ {name: 'Images', extensions: ['png']} ]}"></file-chooser>
                            </div>
                        </div>

                        <div style="padding-top:15px" ng-show="hasChannels">
                            <label class="control-fb control--checkbox"> Post screenshot in Discord channel
                                <input type="checkbox" ng-model="effect.postInDiscord">
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                        <div ng-show="effect.postInDiscord" style="margin-left: 30px;">
                            <div>Discord Channel:</div>
                            <dropdown-select options="channelOptions" selected="effect.discordChannelId"></dropdown-select>
                        </div>

                        <div ng-init="showOverlayOption = effect.showInOverlay == true"  style="padding-top:15px" ng-if="showOverlayOption">
                            <label class="control-fb control--checkbox"> Show screenshot in overlay
                                <input type="checkbox" ng-model="effect.showInOverlay">
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                    </eos-container>

                    <discord-webhook-message effect="effect" is-screenshot="true" ng-if="effect.postInDiscord"></discord-webhook-message>

                    <div ng-if="effect.showInOverlay">
                        <eos-container header="Overlay Duration" pad-top="true">
                            <firebot-input model="effect.duration" input-type="number" disable-variables="true" input-title="Secs" />
                        </eos-container>
                        <eos-container header="Overlay Dimensions" pad-top="true">
                            <label class="control-fb control--checkbox"> Force 16:9 Ratio
                                <input type="checkbox" ng-click="forceRatio = !forceRatio" ng-checked="forceRatio">
                                <div class="control__indicator"></div>
                            </label>
                            <div class="input-group">
                                <span class="input-group-addon">Width (in pixels)</span>
                                <input
                                    type="text"
                                    class="form-control"
                                    aria-describeby="video-width-setting-type"
                                    type="number"
                                    ng-change="calculateSize('Width', effect.width)"
                                    ng-model="effect.width">
                                <span class="input-group-addon">Height (in pixels)</span>
                                <input
                                    type="text"
                                    class="form-control"
                                    aria-describeby="video-height-setting-type"
                                    type="number"
                                    ng-change="calculateSize('Height', effect.height)"
                                    ng-model="effect.height">
                            </div>
                        </eos-container>
                        <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>
                        <eos-overlay-rotation effect="effect" pad-top="true"></eos-overlay-rotation>
                        <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>
                        <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
                    </div>
                </div>
            `,
            controller: function($scope, $q, backendCommunicator) {
                const $ctrl = this;
                $ctrl.$onInit = () => {
                    $scope.effect = $ctrl.effect;
                    if ($scope.effect.duration == null) {
                        $scope.effect.duration = 5;
                    }
                    if ($scope.effect.file != null) {
                        $scope.effect.overwriteExisting = true;
                    }
                    if ($scope.effect.fileNamePattern == null) {
                        $scope.effect.fileNamePattern = "$streamTitle $date[YYYY-MM-DD hh.mm.ss.SSS A]";
                    }
                };

                $scope.overwriteExistingChanged = () => {
                    if (!$scope.effect.overwriteExisting) {
                        $scope.effect.file = null;
                    }
                };

                $scope.forceRatio = true;

                // Calculate 16:9
                // This checks to see which field the user is filling out, and then adjust the other field so it's always 16:9.
                $scope.calculateSize = function(widthOrHeight, size) {
                    if (size !== "") {
                        if (widthOrHeight === "Width" && $scope.forceRatio) {
                            $scope.effect.height = String(Math.round(size / 16 * 9));
                        } else if (widthOrHeight === "Height" && $scope.forceRatio) {
                            $scope.effect.width = String(Math.round(size * 16 / 9));
                        }
                    } else {
                        $scope.effect.height = "";
                        $scope.effect.width = "";
                    }
                };

                $scope.hasChannels = false;
                $scope.channelOptions = {};
                $q.when(backendCommunicator.fireEventAsync("getDiscordChannels"))
                    .then((channels) => {
                        if (channels && channels.length > 0) {
                            const newChannels = {};

                            for (const channel of channels) {
                                newChannels[channel.id] = channel.name;
                            }

                            if ($scope.effect.channelId == null ||
                                newChannels[$scope.effect.channelId] == null) {
                                $scope.effect.channelId = channels[0].id;
                            }

                            $scope.channelOptions = newChannels;

                            $scope.hasChannels = true;
                        }
                    });
            }
        });
}());
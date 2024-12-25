"use strict";
(function() {
    //This adds the <eos-audio-output-device> element

    angular
        .module('firebotApp')
        .component("eosAudioOutputDevice", {
            bindings: {
                effect: '=',
                padTop: "<"
            },
            template: `
            <eos-container header="Audio Output Device" pad-top="$ctrl.padTop">
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="chat-effect-type">{{$ctrl.effect.audioOutputDevice ? $ctrl.effect.audioOutputDevice.label : 'App Default'}}</span> <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu chat-effect-dropdown">
                        <li ng-repeat="device in $ctrl.audioOutputDevices" ng-click="$ctrl.effect.audioOutputDevice = device"><a href>{{device.label}}</a></li>
                        <li class="divider"></li>
                        <li role="menuitem" ng-click="$ctrl.effect.audioOutputDevice = {label: 'Send To Overlay', deviceId: 'overlay'}">
                            <a href>Send To Overlay</a>
                        </li>
                    </ul>
                </div>
            </eos-container>
            `,
            controller: function($q, settingsService) {
                const ctrl = this;

                ctrl.settings = settingsService;

                ctrl.audioOutputDevices = [
                    {
                        label: "App Default",
                        deviceId: ""
                    },
                    {
                        label: "System Default",
                        deviceId: "default"
                    }
                ];

                ctrl.$onInit = function() {
                    if (ctrl.effect.audioOutputDevice == null) {
                        ctrl.effect.audioOutputDevice = {
                            label: "App Default",
                            deviceId: ""
                        };
                    }

                    $q.when(navigator.mediaDevices.enumerateDevices()).then((deviceList) => {
                        deviceList = deviceList
                            .filter(
                                d =>
                                    d.kind === "audiooutput" &&
                d.deviceId !== "communications" &&
                d.deviceId !== "default"
                            )
                            .map((d) => {
                                return { label: d.label, deviceId: d.deviceId };
                            });

                        ctrl.audioOutputDevices = ctrl.audioOutputDevices.concat(deviceList);
                    });

                    // Reset overlay instance to default (or null) if the saved instance doesnt exist anymore
                    if (ctrl.effect.overlayInstance != null) {
                        if (
                            !settingsService
                                .getSetting("OverlayInstances")
                                .includes(ctrl.effect.overlayInstance)
                        ) {
                            ctrl.effect.overlayInstance = null;
                        }
                    }
                };
            }
        });
}());

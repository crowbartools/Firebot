"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotAudioOutputDeviceSelect", {
            bindings: {
                deviceId: "="
            },
            template: `
                <firebot-dropdown
                    ng-model="$ctrl.deviceId"
                    options="$ctrl.audioOutputDeviceOptions"
                    placeholder="Select output"
                />
            `,
            controller: function($q, soundService) {
                const $ctrl = this;

                $ctrl.audioOutputDeviceOptions = [];

                $ctrl.$onInit = function() {
                    $q.when(soundService.getOutputDevices()).then((deviceList) => {
                        $ctrl.audioOutputDeviceOptions = [
                            { name: "App Default", value: undefined },
                            { name: "System Default", value: "default" },
                            ...deviceList.map(d => ({ name: d.label, value: d.deviceId })),
                            { name: "divider" },
                            { name: 'Send To Overlay', value: 'overlay' }
                        ];
                    });
                };
            }
        });
}());

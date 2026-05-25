"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("firebotAudioOutputDeviceSelect", {
            bindings: {
                device: "="
            },
            template: `
                <firebot-dropdown
                    ng-model="$ctrl.deviceId"
                    on-update="$ctrl.updateSelectedDevice()"
                    options="$ctrl.audioOutputDeviceOptions"
                    option-toggling="false"
                    placeholder="Select output"
                />
            `,
            controller: function($q, soundService) {
                const $ctrl = this;

                $ctrl.deviceId = "";
                $ctrl.audioOutputDeviceOptions = [];

                $ctrl.updateSelectedDevice = () => {
                    const foundDevice = $ctrl.audioOutputDeviceOptions.find(d => d.value === $ctrl.deviceId);

                    if (foundDevice) {
                        $ctrl.device = {
                            label: foundDevice.name,
                            deviceId: foundDevice.value
                        };
                    }
                };

                $ctrl.$onInit = async () => {
                    const deviceList = (await soundService.getOutputDevices())
                        .toSorted((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

                    $ctrl.audioOutputDeviceOptions = [
                        { name: "App Default", value: undefined },
                        { name: "System Default", value: "default" },
                        ...deviceList.map(d => ({ name: d.label, value: d.deviceId })),
                        { name: "divider" },
                        { name: "Send To Overlay", value: "overlay" }
                    ];

                    $ctrl.deviceId = $ctrl.device?.deviceId;
                };
            }
        });
}());
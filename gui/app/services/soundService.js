'use strict';


(function() {

    // This provides methods for playing sounds

    angular
        .module('firebotApp')
        .factory('soundService', function (settingsService, listenerService, $q, websocketService) {
            let service = {};

            // Connection Sounds
            service.connectSound = function(type) {
                if (settingsService.soundsEnabled() === "On") {
                    let outputDevice = settingsService.getAudioOutputDevice();
                    if (type === "Online") {
                        service.playSound("../sounds/online.mp3", 0.2, outputDevice);
                    } else {
                        service.playSound("../sounds/offline.mp3", 0.2, outputDevice);
                    }
                }
            };


            service.playSound = function(path, volume, outputDevice) {

                $q.when(navigator.mediaDevices.enumerateDevices()).then(deviceList => {
                    let filteredDevice = deviceList.filter(d => d.label === outputDevice.label || d.deviceId === outputDevice.deviceId);

                    let sinkId = filteredDevice.length > 0 ? filteredDevice[0].deviceId : 'default';

                    let sound = new howler.Howl({
                        src: [path],
                        volume: volume,
                        html5: true,
                        sinkId: sinkId
                    });

                    sound.play();
                });
            };

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.PLAY_SOUND },
                (data) => {
                    let filepath = data.filepath;
                    let volume = (data.volume / 100) * 10;

                    let selectedOutputDevice = data.audioOutputDevice;
                    if (selectedOutputDevice == null || selectedOutputDevice.label === "App Default") {
                        selectedOutputDevice = settingsService.getAudioOutputDevice();
                    }

                    if (selectedOutputDevice.deviceId === 'overlay') {
                        websocketService.broadcast({
                            event: "sound",
                            filepath: filepath,
                            volume: volume,
                            resourceToken: data.resourceToken
                        });
                    } else {
                        service.playSound(filepath, volume, selectedOutputDevice);
                    }


                });

            return service;
        });
}(window.angular));

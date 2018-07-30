'use strict';


(function() {

    const { Howl, Howler } = require("howler");

    // This provides methods for playing sounds

    angular
        .module('firebotApp')
        .factory('soundService', function (logger, settingsService, listenerService, $q, websocketService) {
            let service = {};

            // Connection Sounds
            service.connectSound = function(type) {
                if (settingsService.soundsEnabled() === "On") {
                    let outputDevice = settingsService.getAudioOutputDevice();
                    if (type === "Online") {
                        service.playSound("../sounds/connect.mp3", 0.2, outputDevice);
                    } else {
                        service.playSound("../sounds/disconnect.mp3", 0.2, outputDevice);
                    }
                }
            };

            service.notificationSoundOptions = [
                {
                    name: "None",
                    path: ""
                },
                {
                    name: "Computer Chime",
                    path: "../sounds/alerts/computer-chime.wav"
                },
                {
                    name: "Computer Chirp",
                    path: "../sounds/alerts/computer-chirp.wav"
                },
                {
                    name: "Piano",
                    path: "../sounds/alerts/piano.wav"
                },
                {
                    name: "Ping",
                    path: "../sounds/alerts/ping.wav"
                },
                {
                    name: "Doorbell",
                    path: "../sounds/alerts/doorbell.wav"
                },
                {
                    name: "Custom",
                    path: ""
                }
            ];

            service.playChatNotification = function() {
                let selectedSound = settingsService.getTaggedNotificationSound();

                if (selectedSound.name === "None") return;

                if (selectedSound.name !== "Custom") {
                    selectedSound = service.notificationSoundOptions.find(n => n.name === selectedSound.name);
                }

                let volume = (settingsService.getTaggedNotificationVolume() / 100) * 10;
                logger.debug("noti volume: " + volume);
                if (selectedSound.path != null && selectedSound.path !== "") {
                    service.playSound(selectedSound.path, volume);
                }
            };


            service.playSound = function(path, volume, outputDevice = settingsService.getAudioOutputDevice()) {

                $q.when(navigator.mediaDevices.enumerateDevices()).then(deviceList => {
                    let filteredDevice = deviceList.filter(d => d.label === outputDevice.label || d.deviceId === outputDevice.deviceId);

                    let sinkId = filteredDevice.length > 0 ? filteredDevice[0].deviceId : 'default';

                    let sound = new Howl({
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
                            resourceToken: data.resourceToken,
                            overlayInstance: data.overlayInstance
                        });

                    } else {
                        service.playSound(filepath, volume, selectedOutputDevice);
                    }


                });

            service.stopAllSounds = function() {
                logger.info("Stopping all sounds...");
                Howler.unload();
            };

            listenerService.registerListener(
                { type: listenerService.ListenerType.CLEAR_EFFECTS },
                () => {
                    service.stopAllSounds();
                });

            return service;
        });
}(window.angular));

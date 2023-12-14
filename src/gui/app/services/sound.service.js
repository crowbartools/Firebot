"use strict";

(function() {

    const { Howl, Howler } = require("howler");

    // This provides methods for playing sounds

    angular
        .module("firebotApp")
        .factory("soundService", function(logger, settingsService, listenerService, $q, websocketService, backendCommunicator) {
            const service = {};

            // Connection Sounds
            service.connectSound = function(type) {
                if (settingsService.soundsEnabled() === "On") {
                    const outputDevice = settingsService.getAudioOutputDevice();
                    if (type === "Online") {
                        service.playSound("../sounds/connect_new_b.mp3", 0.2, outputDevice);
                    } else {
                        service.playSound("../sounds/disconnect_new_b.mp3", 0.2, outputDevice);
                    }
                }
            };

            let popCounter = 0;
            service.popSound = function() {
                if (settingsService.soundsEnabled() === "On") {
                    const outputDevice = settingsService.getAudioOutputDevice();
                    popCounter++;
                    if (popCounter > 4) {
                        popCounter = 1;
                    }
                    const popSoundName = `pop${popCounter}.wav`;
                    service.playSound(`../sounds/pops/${popSoundName}`, 0.1, outputDevice);
                }
            };
            service.resetPopCounter = function() {
                popCounter = 0;
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
                    name: "Hey",
                    path: "../sounds/alerts/hey.mp3"
                },
                {
                    name: "Hello There",
                    path: "../sounds/alerts/hellothere.mp3"
                },
                {
                    name: "Custom",
                    path: ""
                }
            ];

            service.playChatNotification = function() {
                let selectedSound = settingsService.getTaggedNotificationSound();

                if (selectedSound.name === "None") {
                    return;
                }

                if (selectedSound.name !== "Custom") {
                    selectedSound = service.notificationSoundOptions.find(
                        n => n.name === selectedSound.name
                    );
                }

                const volume = settingsService.getTaggedNotificationVolume() / 100 * 10;
                if (selectedSound.path != null && selectedSound.path !== "") {
                    service.playSound(selectedSound.path, volume);
                }
            };


            service.playSound = function(path, volume, outputDevice, fileType = null, maxSoundLength = null) {

                if (outputDevice == null) {
                    outputDevice = settingsService.getAudioOutputDevice();
                }

                $q.when(service.getHowlSound(path, volume, outputDevice, fileType))
                    .then(sound => {

                        let maxSoundLengthTimeout;
                        // Clear listener after first call.
                        sound.once('load', function() {
                            sound.play();

                            const intMaxSoundLength = parseInt(maxSoundLength);
                            if (intMaxSoundLength > 0) {
                                maxSoundLengthTimeout = setTimeout(function() {
                                    sound.stop();
                                    sound.unload();
                                }, maxSoundLength * 1000);
                            }
                        });

                        // Fires when the sound finishes playing.
                        sound.once('end', function() {
                            sound.unload();
                            clearInterval(maxSoundLengthTimeout);
                        });

                        sound.load();
                    });
            };

            service.getHowlSound = function(path, volume, outputDevice = settingsService.getAudioOutputDevice(), fileType = null) {
                return navigator.mediaDevices.enumerateDevices()
                    .then(deviceList => {
                        const filteredDevice = deviceList.filter(d => d.label === outputDevice.label
                            || d.deviceId === outputDevice.deviceId);

                        const sinkId = filteredDevice.length > 0 ? filteredDevice[0].deviceId : 'default';

                        const sound = new Howl({
                            src: [path],
                            volume: volume,
                            format: fileType,
                            html5: true,
                            sinkId: sinkId,
                            preload: false
                        });

                        return sound;
                    });
            };

            service.getSoundDuration = function(path, format = undefined) {
                return new Promise(resolve => {

                    console.log("duration for", path, format);

                    const sound = new Howl({
                        src: [path],
                        format: format || [],
                        onload: () => {
                            resolve(sound.duration());
                            sound.unload();
                        },
                        onloaderror: () => {
                            resolve(0);
                        }
                    });
                });
            };

            backendCommunicator.onAsync("getSoundDuration", async (data) => {
                return await service.getSoundDuration(data.path, data.format);
            });

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.PLAY_SOUND },
                data => {
                    const filepath = data.filepath;
                    const volume = data.volume / 100 * 10;

                    let selectedOutputDevice = data.audioOutputDevice;
                    if (
                        selectedOutputDevice == null ||
                        selectedOutputDevice.label === "App Default"
                    ) {
                        selectedOutputDevice = settingsService.getAudioOutputDevice();
                    }

                    if (selectedOutputDevice.deviceId === 'overlay') {

                        websocketService.broadcast({
                            event: "sound",
                            filepath: filepath,
                            url: data.url,
                            isUrl: data.isUrl,
                            format: data.format,
                            volume: volume,
                            resourceToken: data.resourceToken,
                            overlayInstance: data.overlayInstance,
                            maxSoundLength: data.maxSoundLength
                        });

                    } else {
                        service.playSound(data.isUrl ? data.url : data.filepath, volume, selectedOutputDevice, data.format, data.maxSoundLength);
                    }
                }
            );

            service.stopAllSounds = function() {
                logger.info("Stopping all sounds...");
                Howler.unload();
            };

            backendCommunicator.on("stop-all-sounds", () => {
                service.stopAllSounds();
            });

            // Note(ebiggz): After updating to latest electron (7.1.9), initial sounds have a noticable delay, almost as if theres a warm up time.
            // This gets around that by playing a sound with no audio right at app start, to trigger audio library warm up
            service.playSound("../sounds/secofsilence.mp3", 0.0);

            return service;
        });
}(window.angular));

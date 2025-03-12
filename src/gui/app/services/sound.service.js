"use strict";

(function() {
    // This provides methods for playing sounds

    angular
        .module("firebotApp")
        .factory("soundService", function(logger, settingsService, $q, backendCommunicator, audioPool) {
            const service = {};

            // Connection Sounds
            service.connectSound = function(type) {
                if (settingsService.getSetting("SoundsEnabled") === "On") {
                    const outputDevice = settingsService.getSetting("AudioOutputDevice");
                    if (type === "Online") {
                        service.playSound("../sounds/connect_new_b.mp3", 0.2, outputDevice);
                    } else {
                        service.playSound("../sounds/disconnect_new_b.mp3", 0.2, outputDevice);
                    }
                }
            };

            let popCounter = 0;
            service.popSound = function() {
                if (settingsService.getSetting("SoundsEnabled") === "On") {
                    const outputDevice = settingsService.getSetting("AudioOutputDevice");
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
                let selectedSound = settingsService.getSetting("ChatTaggedNotificationSound");

                if (selectedSound.name === "None") {
                    return;
                }

                if (selectedSound.name !== "Custom") {
                    selectedSound = service.notificationSoundOptions.find(
                        n => n.name === selectedSound.name
                    );
                }

                const volume = settingsService.getSetting("ChatTaggedNotificationVolume") / 100 * 10;
                if (selectedSound.path != null && selectedSound.path !== "") {
                    service.playSound(selectedSound.path, volume);
                }
            };


            service.playSound = function(path, volume, outputDevice, maxSoundLength = null) {
                if (outputDevice == null) {
                    outputDevice = settingsService.getSetting("AudioOutputDevice");
                }

                $q.when(service.getSound(path, volume, outputDevice))
                    .then(/** @param {HTMLAudioElement} sound */ (sound) => {

                        if (sound == null) {
                            return;
                        }

                        let maxSoundLengthTimeoutId;

                        const soundEndEventHandler = function() {
                            // Clear listener after first call.
                            sound.removeEventListener("ended", soundEndEventHandler);
                            sound.removeEventListener("error", soundEndEventHandler);

                            audioPool.returnAudioToPool(sound);

                            clearTimeout(maxSoundLengthTimeoutId);
                        };

                        const soundLoadEventHandler = function() {
                            // Clear listener after first call.
                            sound.removeEventListener("canplay", soundLoadEventHandler);
                            sound.play();

                            const intMaxSoundLength = parseInt(maxSoundLength);
                            if (intMaxSoundLength > 0) {
                                maxSoundLengthTimeoutId = setTimeout(function() {
                                    sound.pause();
                                    soundEndEventHandler();
                                }, maxSoundLength * 1000);
                            }
                        };

                        sound.addEventListener("canplay", soundLoadEventHandler);

                        // Fires when the sound finishes playing.
                        sound.addEventListener("ended", soundEndEventHandler);
                        sound.addEventListener("error", soundEndEventHandler);

                        sound.load();
                    });
            };

            service.getSound = async function(path, volume, outputDevice = settingsService.getSetting("AudioOutputDevice"), usePool = true) {
                const deviceList = await navigator.mediaDevices.enumerateDevices();

                const filteredDevice = deviceList.find(d => d.label === outputDevice.label
                    || d.deviceId === outputDevice.deviceId);

                let sound;
                try {
                    sound = usePool ? audioPool.obtainAudioFromPool() : new Audio();

                    sound.src = path;
                    sound.volume = volume;

                    await sound.setSinkId(filteredDevice?.deviceId ?? 'default');

                } catch (e) {
                    if (sound && usePool) {
                        audioPool.returnAudioToPool(sound);
                    }
                    logger.error("Error obtaining audio from pool, skipping play sound...", e);
                }

                return sound;
            };

            /**
             * Combination of fix from:
             * https://github.com/nmori/Firebot/blob/f53d12fe774059327dadedf4fa8268f4e53cad7f/src/gui/app/services/sound.service.js#L174-L182
             *
             * While maintaining duration precision from Howler:
             * https://github.com/ebiggz/howler.js/blob/0bbfe6623e13bef8e58c789f5f67bfc87d50000b/src/howler.core.js#L2052
             */
            service.getSoundDuration = function(path) {
                return new Promise((resolve) => {
                    const audio = new Audio(path);
                    audio.addEventListener("loadedmetadata", () => {
                        resolve(Math.ceil(audio.duration * 10) / 10);
                    });
                    audio.addEventListener("error", () => {
                        resolve(0);
                    });
                });
            };

            backendCommunicator.onAsync("getSoundDuration", async (data) => {
                return await service.getSoundDuration(data.path, data.format);
            });

            // Watches for an event from main process
            backendCommunicator.on("playsound", (data) => {
                const volume = data.volume / 100 * 10;

                let selectedOutputDevice = data.audioOutputDevice;
                if (
                    selectedOutputDevice == null ||
                    selectedOutputDevice.label === "App Default"
                ) {
                    selectedOutputDevice = settingsService.getSetting("AudioOutputDevice");
                }

                if (selectedOutputDevice.deviceId !== 'overlay') {
                    service.playSound(data.isUrl ? data.url : data.filepath, volume, selectedOutputDevice, data.maxSoundLength);
                }
            });

            service.stopAllSounds = function() {
                logger.info("Stopping all sounds...");
                audioPool.returnAllAudioToPool();
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

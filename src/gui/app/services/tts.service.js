"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("ttsService", function($q, settingsService, backendCommunicator) {
            const service = {};

            let voices = [];

            const obtainVoices = () => {
                return new Promise(function(resolve) {
                    let foundVoices = speechSynthesis.getVoices();
                    if (foundVoices.length > 0) {
                        resolve(foundVoices);
                    } else {
                        speechSynthesis.addEventListener("voiceschanged", function() {
                            foundVoices = speechSynthesis.getVoices();
                            if (foundVoices.length > 0) {
                                resolve(foundVoices);
                                speechSynthesis.removeEventListener("voiceschanged", this);
                            }
                        });
                    }
                });
            };
            service.obtainVoices = () => {
                return new Promise((resolve) => {
                    $q.when(obtainVoices()).then((foundVoices) => {
                        voices = foundVoices;
                        resolve();
                    });
                });
            };

            service.getVoices = () => {
                return voices.map((v) => {
                    return {
                        id: v.voiceURI,
                        name: v.name
                    };
                });
            };

            service.getVoiceById = (id) => {
                if (id === 'default' || id == null) {
                    id = service.getFirebotDefaultVoiceId();
                }
                const voices = service.getVoices();
                return voices.find(v => v.id === id);
            };

            service.getFirebotDefaultVoiceId = () => {
                const savedDefaultVoiceId = settingsService.getSetting("DefaultTtsVoiceId");
                if (savedDefaultVoiceId) {
                    return savedDefaultVoiceId;
                }
                return service.getOsDefaultVoiceId();
            };

            service.getOsDefaultVoiceId = () => {
                const voices = speechSynthesis.getVoices();

                const defaultVoice = voices.find(v => v.default === true);

                return defaultVoice;
            };

            /**
             * @param {string} text The text to be synthesized.
             * @param {"default" | string | null} voiceId The name of the voice to use.
             * @param {boolean} wait Whether or not to wait for the speech to finish.
             * @returns {Promise<void>}
             */
            service.readText = async (text, voiceId, wait) => {
                if (text == null || text.length < 1) {
                    return;
                }

                if (voiceId === 'default' || voiceId == null) {
                    voiceId = service.getFirebotDefaultVoiceId();
                }
                if (voiceId == null) {
                    return;
                }

                const speechSynthesisVoice = voices.find(v => v.voiceURI === voiceId);
                if (speechSynthesisVoice == null) {
                    return;
                }

                const msg = new SpeechSynthesisUtterance();
                msg.voice = speechSynthesisVoice;
                msg.volume = settingsService.getSetting("TtsVoiceVolume");
                msg.rate = settingsService.getSetting("TtsVoiceRate");
                msg.text = text;
                msg.lang = "en-US";

                if (wait === true) {
                    await new Promise(function(resolve) {
                        msg.onend = () => resolve();
                        msg.onerror = () => resolve();
                        speechSynthesis.speak(msg);
                    });
                } else {
                    speechSynthesis.speak(msg);
                }
            };

            backendCommunicator.onAsync("read-tts", async (data) => {
                const { text, voiceId, wait } = data;
                return await service.readText(text, voiceId, wait);
            });

            backendCommunicator.on("stop-all-sounds", () => {
                speechSynthesis.cancel();
            });

            return service;
        });
}(window.angular));

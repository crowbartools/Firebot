"use strict";

(function() {

    /**
     * @typedef {HTMLAudioElement & { _inUse: boolean, _inUseAt?: number }} AugmentedAudioElement
     */

    const INITIAL_POOL_SIZE = 10;
    const MAX_POOL_SIZE = 75;

    angular
        .module("firebotApp")
        .factory("audioPool", function() {
            const service = {};

            /**
             * @returns {AugmentedAudioElement}
             */
            function createPoolableAudio() {
                const audio = new Audio();
                audio._inUse = false;
                return audio;
            }

            /**
             * Pool of audio elements
             * @type {AugmentedAudioElement[]}
             */
            const audioPool = Array(INITIAL_POOL_SIZE)
                .fill(null)
                .map(createPoolableAudio);

            service.obtainAudioFromPool = () => {
                let audio = audioPool.find(audio => !audio._inUse);

                if (!audio) {
                    if (audioPool.length >= MAX_POOL_SIZE) {
                        // find the oldest audio element in use
                        const oldestAudio = audioPool
                            .filter(audio => audio._inUse)
                            .reduce((oldest, current) => {
                                if (!oldest) {
                                    return current;
                                }
                                return (current._inUseAt < oldest._inUseAt) ? current : oldest;
                            });

                        service.returnAudioToPool(oldestAudio);

                        audio = oldestAudio;
                    } else {
                        audio = createPoolableAudio();
                        audioPool.push(audio);
                    }
                }

                audio._inUse = true;
                audio._inUseAt = Date.now();

                return audio;
            };

            /**
             *
             * @param {AugmentedAudioElement} audio
             */
            service.returnAudioToPool = (audio) => {
                audio.dispatchEvent(new Event("ended"));

                audio.pause();

                // Set the source to a 0-second silence to stop any downloading
                audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                audio.srcObject = null;

                audio._inUse = false;
            };

            service.returnAllAudioToPool = () => {
                audioPool.forEach(service.returnAudioToPool);
            };

            return service;
        });
}(window.angular));
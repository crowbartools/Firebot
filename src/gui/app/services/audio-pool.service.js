"use strict";

(function() {

    /**
     * @typedef {HTMLAudioElement & { _inUse: boolean }} AugmentedAudioElement
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
                        throw new Error("Hit maximum active audio nodes");
                    }
                    audio = createPoolableAudio();
                    audioPool.push(audio);
                }

                audio._inUse = true;
                return audio;
            };

            /**
             *
             * @param {AugmentedAudioElement} audio
             */
            service.returnAudioToPool = (audio) => {
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
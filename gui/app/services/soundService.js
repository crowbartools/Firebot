'use strict';

const Howl = require('howler');

(function() {

    // This provides methods for playing sounds

    angular
        .module('firebotApp')
        .factory('soundService', function (settingsService, listenerService) {
            let service = {};

            // Connection Sounds
            service.connectSound = function(type) {
                if (settingsService.soundsEnabled() === "On") {
                    if (type === "Online") {
                        service.playSound("../sounds/online.mp3", 0.2);
                    } else {
                        service.playSound("../sounds/offline.mp3", 0.2);
                    }
                }
            };

            service.playSound = function(path, volume) {
                let sound = new Howl({
                    src: [path],
                    volume: volume
                });
                sound.play();
            };

            // Watches for an event from main process
            listenerService.registerListener(
                { type: listenerService.ListenerType.PLAY_SOUND },
                (data) => {
                    let filepath = data.filepath;
                    let volume = (data.volume / 100) * 10;

                    service.playSound(filepath, volume);
                });

            return service;
        });
}(window.angular));

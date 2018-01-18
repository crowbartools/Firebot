'use strict';


(function() {

    // This provides methods for handling hotkeys

    angular
        .module('firebotApp')
        .factory('hotkeyService', function () {
            let service = {};

            service.isCapturingHotkey = false;

            // keys not accepted by Electron for global shortcuts
            const prohibitedKeys = [
                'CapsLock',
                'NumLock',
                'ScrollLock',
                'Pause'
            ];

            // this maps keys to codes accepted in Electron's Accelerator strings, used for global shortcuts
            function mapKeyToAcceleratorCode(key) {
                switch (key) {
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    return key.replace('Arrow', '');
                case 'AudioVolumeMute':
                case 'AudioVolumeDown':
                case 'AudioVolumeUp':
                    return key.replace('Audio', '');
                case '+':
                    return "Plus";
                case ' ':
                    return "Space";
                case 'MediaTrackPrevious':
                    return "MediaPreviousTrack";
                case 'MediaTrackNext':
                    return "MediaNextTrack";
                case 'Meta':
                    return 'Super';
                case 'Control':
                    return 'CmdOrCtrl';
                default:
                    if (key.length === 0) {
                        return key.toUpperCase();
                    }
                    return key;
                }
            }

            function getDisplayNameFromKeyCode(keyCode) {
                switch (keyCode) {
                case 'CmdOrCtrl':
                    return 'Ctrl';
                case 'Super':
                    return 'Windows';
                default:
                    return keyCode;
                }
            }

            function keyCodeIsModifier(keyCode) {
                switch (keyCode) {
                case 'CmdOrCtrl':
                case 'Super':
                case 'Alt':
                case 'Shift':
                    return true;
                default:
                    return false;
                }
            }

            let cachedKeys = [];
            let releasedKeyCodes = [];
            let stopCallback;

            const keyDownListener = function(event) {
                if (!service.isCapturingHotkey) return;

                if (prohibitedKeys.includes(event.key)) return;

                let alreadyPressed = cachedKeys.some(k => k.rawKey === event.key);

                //skip if repeat of keys already inputted and no keys have been released
                if (alreadyPressed && releasedKeyCodes.length === 0) return;

                //clear out any keys that have since been released
                releasedKeyCodes.forEach(k => {
                    if (cachedKeys.some(key => key.rawKey === k)) {
                        cachedKeys = cachedKeys.filter(key => key.rawKey !== k);
                    }
                });
                releasedKeyCodes = [];

                if (!alreadyPressed) {
                    let mappedKey = mapKeyToAcceleratorCode(event.key),
                        displayName = getDisplayNameFromKeyCode(mappedKey),
                        isModifier = keyCodeIsModifier(mappedKey);

                    cachedKeys.push({
                        code: mappedKey,
                        displayName: displayName,
                        isModifier: isModifier,
                        rawKey: event.key
                    });
                }
            };

            const keyUpListener = function(event) {
                if (!service.isCapturingHotkey) return;
                releasedKeyCodes.push(event.key);
            };

            const clickListener = function() {
                service.stopHotkeyCapture();
            };

            service.startHotkeyCapture = function(callback) {
                if (service.isCapturingHotkey) {
                    throw new Error("Attempted to start a hotkey capture when capturing is already in progress.");
                }

                stopCallback = callback;

                service.isCapturingHotkey = true;
                console.log("starting hotkey capture");
                window.addEventListener('keydown', keyDownListener, true);
                window.addEventListener('keyup', keyUpListener, true);
                window.addEventListener('mousedown', clickListener, true);
            };

            service.stopHotkeyCapture = function() {
                if (service.isCapturingHotkey) {
                    console.log("stopping hotkey recording");
                    window.removeEventListener('keydown', keyDownListener, true);
                    window.removeEventListener('keyup', keyUpListener, true);
                    service.isCapturingHotkey = false;

                    if (typeof stopCallback === "function") {
                        stopCallback(cachedKeys.splice(0));
                    }
                    cachedKeys = [];
                }
                window.removeEventListener('mousedown', clickListener, true);
            };

            service.getCurrentlyPressedHotkey = function() {
                return cachedKeys.splice(0);
            };


            return service;
        });
}(window.angular));

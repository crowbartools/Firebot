'use strict';

const dataAccess = require('../../lib/common/data-access.js');

(function() {

    // This provides methods for handling hotkeys

    angular
        .module('firebotApp')
        .factory('hotkeyService', function ($rootScope, utilityService, logger) {
            let service = {};

            /**
             * Hotkey Capturing
             */
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
                    if (key.length === 1) {
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

            function getAcceleratorCodeFromKeys(keys) {
                return keys.map(k => k.code).join("+");
            }

            let cachedKeys = [];
            let releasedKeyCodes = [];
            let stopCallback;

            const keyDownListener = function(event) {
                if (!service.isCapturingHotkey) return;

                let alreadyPressed = cachedKeys.some(k => k.rawKey.toUpperCase() === event.key.toUpperCase());

                //skip if repeat of keys already inputted and no keys have been released
                if (alreadyPressed && releasedKeyCodes.length === 0) return;

                if (prohibitedKeys.includes(event.key)) return;

                //clear out any keys that have since been released
                releasedKeyCodes.forEach(k => {
                    let normalizedK = k.toUpperCase();
                    if (cachedKeys.some(key => key.rawKey.toUpperCase() === normalizedK)) {
                        cachedKeys = cachedKeys.filter(key => key.rawKey.toUpperCase() !== normalizedK);
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

                    $rootScope.$broadcast("hotkey:capture:update", { hotkey: getAcceleratorCodeFromKeys(cachedKeys) });
                }
            };

            const keyUpListener = function(event) {
                if (!service.isCapturingHotkey) return;
                releasedKeyCodes.push(event.key);
            };

            const clickListener = function(event) {
                if (service.isCapturingHotkey) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    event.preventDefault();
                }
                service.stopHotkeyCapture();
            };

            service.startHotkeyCapture = function(callback) {
                if (service.isCapturingHotkey) {
                    throw new Error("Attempted to start a hotkey capture when capturing is already in progress.");
                }

                stopCallback = callback;

                service.isCapturingHotkey = true;
                logger.info("Starting hotkey capture...");
                window.addEventListener('keydown', keyDownListener, true);
                window.addEventListener('keyup', keyUpListener, true);
                window.addEventListener('click', clickListener, true);
            };

            service.stopHotkeyCapture = function() {
                if (service.isCapturingHotkey) {
                    logger.info("Stopping hotkey recording");
                    window.removeEventListener('keydown', keyDownListener, true);
                    window.removeEventListener('keyup', keyUpListener, true);
                    service.isCapturingHotkey = false;

                    if (typeof stopCallback === "function") {
                        stopCallback(getAcceleratorCodeFromKeys(cachedKeys));
                    }
                    cachedKeys = [];
                }
                window.removeEventListener('click', clickListener, true);
            };

            service.getCurrentlyPressedHotkey = function() {
                return JSON.parse(JSON.stringify(cachedKeys));
            };

            service.getDisplayFromAcceleratorCode = function(code) {
                if (code == null) return "";

                let keys = code.split("+");

                keys = keys.map(k => getDisplayNameFromKeyCode(k).toUpperCase());

                return keys.join(" + ");
            };

            /**
             * Hotkey Data Access
             */

            let userHotkeys = [];

            service.loadHotkeys = function() {
                let hotkeyDb = dataAccess.getJsonDbInUserData("/user-settings/hotkeys");
                try {
                    let hotkeyData = hotkeyDb.getData('/');
                    if (hotkeyData != null && hotkeyData.length > 0) {
                        userHotkeys = hotkeyData || [];
                    }
                } catch (err) {
                    logger.error(err);
                }
            };

            function saveHotkeysToFile() {
                let hotkeyDb = dataAccess.getJsonDbInUserData("/user-settings/hotkeys");
                try {
                    hotkeyDb.push("/", userHotkeys);
                } catch (err) {
                    logger.error(err);
                }

                // Refresh the backend hotkeycache
                ipcRenderer.send('refreshHotkeyCache');
            }

            service.saveHotkey = function(hotkey) {
                hotkey.uuid = utilityService.generateUuid();

                userHotkeys.push(hotkey);

                saveHotkeysToFile();
            };

            service.updateHotkey = function(hotkey) {

                let index = userHotkeys.findIndex(k => k.uuid === hotkey.uuid);

                userHotkeys[index] = hotkey;

                saveHotkeysToFile();
            };

            service.deleteHotkey = function(hotkey) {

                userHotkeys = userHotkeys.filter(k => k.uuid !== hotkey.uuid);

                saveHotkeysToFile();
            };

            service.hotkeyCodeExists = function(hotkeyId, hotkeyCode) {
                return userHotkeys.some(k => k.code === hotkeyCode && k.uuid !== hotkeyId);
            };

            service.getHotkeys = function() {
                return userHotkeys;
            };

            service.loadHotkeys();

            return service;
        });
}(window.angular));

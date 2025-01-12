"use strict";

(function() {
    // This provides methods for handling hotkeys

    angular
        .module("firebotApp")
        .factory("hotkeyService", function($rootScope, logger, backendCommunicator) {
            const service = {};

            /**
             * Hotkey Capturing
             */
            service.isCapturingHotkey = false;

            // keys not accepted by Electron for global shortcuts
            const prohibitedKeys = ["CapsLock", "NumLock", "ScrollLock", "Pause"];

            // this maps keys to codes accepted in Electron's Accelerator strings, used for global shortcuts
            function mapKeyToAcceleratorCode(key, location) {
                if (location === 3) {
                    switch (key) {
                        case "0":
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                        case "5":
                        case "6":
                        case "7":
                        case "8":
                        case "9":
                            return `num${key}`;

                        case ".":
                            return "numdec";

                        case "+":
                            return "numadd";

                        case "-":
                            return "numsub";

                        case "*":
                            return "nummult";

                        case "/":
                            return "numdiv";
                    }
                }
                switch (key) {
                    case "ArrowUp":
                    case "ArrowDown":
                    case "ArrowLeft":
                    case "ArrowRight":
                        return key.replace("Arrow", "");
                    case "AudioVolumeMute":
                    case "AudioVolumeDown":
                    case "AudioVolumeUp":
                        return key.replace("Audio", "");
                    case "+":
                        return "Plus";
                    case " ":
                        return "Space";
                    case "MediaTrackPrevious":
                        return "MediaPreviousTrack";
                    case "MediaTrackNext":
                        return "MediaNextTrack";
                    case "Meta":
                        return "Super";
                    case "Control":
                        return "CmdOrCtrl";
                    default:
                        if (key.length === 1) {
                            return key.toUpperCase();
                        }
                        return key;
                }
            }

            function getDisplayNameFromKeyCode(keyCode) {
                if (keyCode.startsWith("num")) {
                    switch (keyCode) {
                        case "numadd":
                            return "Plus(Numpad)";
                        case "numsub":
                            return "-(Numpad)";
                        case "nummult":
                            return "*(Numpad)";
                        case "numdiv":
                            return "/(Numpad)";
                        case "numdec":
                            return ".(Numpad)";
                        default:
                            return `${keyCode.substring(3)}(Numpad)`;
                    }
                }

                switch (keyCode) {
                    case "CmdOrCtrl":
                        return "Ctrl";
                    case "Super":
                        return "Windows";
                    default:
                        return keyCode;
                }
            }

            function keyCodeIsModifier(keyCode) {
                switch (keyCode) {
                    case "CmdOrCtrl":
                    case "Super":
                    case "Alt":
                    case "Shift":
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
                if (!service.isCapturingHotkey) {
                    return;
                }

                const alreadyPressed = cachedKeys.some(
                    k => k.rawKey.toUpperCase() === event.key.toUpperCase()
                );

                //skip if repeat of keys already inputted and no keys have been released
                if (alreadyPressed && releasedKeyCodes.length === 0) {
                    return;
                }

                if (prohibitedKeys.includes(event.key)) {
                    return;
                }

                //clear out any keys that have since been released
                releasedKeyCodes.forEach((k) => {
                    const normalizedK = k.toUpperCase();
                    if (
                        cachedKeys.some(key => key.rawKey.toUpperCase() === normalizedK)
                    ) {
                        cachedKeys = cachedKeys.filter(
                            key => key.rawKey.toUpperCase() !== normalizedK
                        );
                    }
                });
                releasedKeyCodes = [];

                if (!alreadyPressed) {
                    const mappedKey = mapKeyToAcceleratorCode(event.key, event.location),
                        displayName = getDisplayNameFromKeyCode(mappedKey),
                        isModifier = keyCodeIsModifier(mappedKey);

                    cachedKeys.push({
                        code: mappedKey,
                        displayName: displayName,
                        isModifier: isModifier,
                        rawKey: event.key
                    });

                    $rootScope.$broadcast("hotkey:capture:update", {
                        hotkey: getAcceleratorCodeFromKeys(cachedKeys)
                    });
                }
            };

            const keyUpListener = function(event) {
                if (!service.isCapturingHotkey) {
                    return;
                }

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
                    throw new Error(
                        "Attempted to start a hotkey capture when capturing is already in progress."
                    );
                }

                stopCallback = callback;

                service.isCapturingHotkey = true;
                logger.info("Starting hotkey capture...");
                window.addEventListener("keydown", keyDownListener, true);
                window.addEventListener("keyup", keyUpListener, true);
                window.addEventListener("click", clickListener, true);
            };

            service.stopHotkeyCapture = function() {
                if (service.isCapturingHotkey) {
                    logger.info("Stopping hotkey recording");
                    window.removeEventListener("keydown", keyDownListener, true);
                    window.removeEventListener("keyup", keyUpListener, true);
                    service.isCapturingHotkey = false;

                    if (typeof stopCallback === "function") {
                        stopCallback(getAcceleratorCodeFromKeys(cachedKeys));
                    }
                    cachedKeys = [];
                }
                window.removeEventListener("click", clickListener, true);
            };

            service.getCurrentlyPressedHotkey = function() {
                return JSON.parse(JSON.stringify(cachedKeys));
            };

            service.getDisplayFromAcceleratorCode = function(code) {
                if (code == null) {
                    return "";
                }

                let keys = code.split("+");

                keys = keys.map(k => getDisplayNameFromKeyCode(k).toUpperCase());

                return keys.join(" + ");
            };

            let userHotkeys = [];

            service.loadHotkeys = function() {
                userHotkeys = backendCommunicator.fireEventSync("hotkeys:get-hotkeys");
            };

            service.addHotkey = function(hotkey) {
                backendCommunicator.send("hotkeys:add-hotkey", hotkey);
            };

            service.updateHotkey = function(hotkey) {
                backendCommunicator.send("hotkeys:update-hotkey", hotkey);
            };

            service.deleteHotkey = function(hotkey) {
                backendCommunicator.send("hotkeys:delete-hotkey", hotkey.id);
            };

            service.hotkeyCodeExists = function(hotkeyId, hotkeyCode) {
                return userHotkeys.some(
                    k => k.code === hotkeyCode && k.id !== hotkeyId
                );
            };

            service.getHotkeys = function() {
                return userHotkeys;
            };

            service.loadHotkeys();

            backendCommunicator.on("import-hotkeys-update", () => {
                service.loadHotkeys();
            });

            backendCommunicator.on("hotkeys:hotkeys-updated", (hotkeys) => {
                userHotkeys = hotkeys;
            });

            return service;
        });
}());
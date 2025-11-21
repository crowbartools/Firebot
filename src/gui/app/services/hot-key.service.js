"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("hotkeyService", function($rootScope, logger, backendCommunicator, modalService, platformService) {
            const service = {};

            service.hotkeys = [];

            const updateHotkey = (hotkey) => {
                const index = service.hotkeys.findIndex(hk => hk.id === hotkey.id);
                if (index > -1) {
                    service.hotkeys[index] = hotkey;
                } else {
                    service.hotkeys.push(hotkey);
                }
            };

            service.loadHotkeys = () => {
                service.hotkeys = backendCommunicator.fireEventSync("hotkeys:get-hotkeys");
            };

            service.deleteHotkey = (hotkeyId) => {
                service.hotkeys = service.hotkeys.filter(hk => hk.id !== hotkeyId);
                backendCommunicator.fireEvent("hotkeys:delete-hotkey", hotkeyId);
            };

            service.saveHotkey = (hotkey) => {
                if (hotkey == null) {
                    return;
                }

                const savedHotkey = backendCommunicator.fireEventSync("hotkeys:save-hotkey", hotkey);
                if (savedHotkey) {
                    updateHotkey(savedHotkey);
                    return true;
                }

                return false;
            };

            service.saveAllHotkeys = (hotkeys) => {
                if (hotkeys) {
                    service.hotkeys = hotkeys;
                }

                backendCommunicator.fireEvent("hotkeys:save-all-hotkeys", service.hotkeys);
            };

            service.toggleHotkeyActiveState = (hotkey) => {
                if (hotkey) {
                    hotkey.active = !hotkey.active;
                    service.saveHotkey(hotkey);
                }
            };

            service.showAddEditHotkeyModal = (hotkey) => {
                modalService.showModal({
                    component: "AddOrEditHotkeyModal",
                    size: "mdlg",
                    keyboard: false,
                    resolveObj: {
                        hotkey: () => hotkey
                    },
                    closeCallback: (response) => {
                        if (response && response.hotkey) {
                            backendCommunicator.send("hotkeys:resume-hotkeys");
                        }
                    }
                });
            };

            backendCommunicator.on("all-hotkeys-updated", (hotkeys) => {
                service.hotkeys = hotkeys;
            });

            /**
             * Hotkey Capturing
             */
            service.isCapturingHotkey = false;

            // keys not accepted by Electron for global shortcuts
            const prohibitedKeys = ["CapsLock", "NumLock", "ScrollLock", "Pause"];

            // this maps keys to codes accepted in Electron's Accelerator strings, used for global shortcuts
            const mapKeyToAcceleratorCode = (key, location) => {
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
            };

            const getDisplayNameFromKeyCode = (keyCode) => {
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
                    case "Super": {
                        if (platformService.isMacOs) {
                            return "Cmd";
                        } else if (platformService.isLinux) {
                            return "Super";
                        }
                        return "Windows";
                    }
                    default:
                        return keyCode;
                }
            };

            const keyCodeIsModifier = (keyCode) => {
                switch (keyCode) {
                    case "CmdOrCtrl":
                    case "Super":
                    case "Alt":
                    case "Shift":
                        return true;
                    default:
                        return false;
                }
            };

            const getAcceleratorCodeFromKeys = (keys) => {
                return keys.map(k => k.code).join("+");
            };

            let cachedKeys = [];
            let releasedKeyCodes = [];
            let stopCallback;

            const keyDownListener = (event) => {
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

            const keyUpListener = (event) => {
                if (!service.isCapturingHotkey) {
                    return;
                }

                releasedKeyCodes.push(event.key);
            };

            const clickListener = (event) => {
                if (service.isCapturingHotkey) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    event.preventDefault();
                }
                service.stopHotkeyCapture();
            };

            service.startHotkeyCapture = (callback) => {
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

            service.stopHotkeyCapture = () => {
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

            service.getCurrentlyPressedHotkey = () => {
                return JSON.parse(JSON.stringify(cachedKeys));
            };

            service.getDisplayFromAcceleratorCode = (code) => {
                if (code == null) {
                    return "";
                }

                let keys = code.split("+");

                keys = keys.map(k => getDisplayNameFromKeyCode(k).toUpperCase());

                return keys.join(" + ");
            };

            service.hotkeyCodeExists = (hotkeyId, hotkeyCode) => {
                return service.hotkeys.some(
                    k => k.code === hotkeyCode && k.id !== hotkeyId
                );
            };

            return service;
        });
}());
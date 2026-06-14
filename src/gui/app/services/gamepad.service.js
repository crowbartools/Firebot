"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("gamepadService", function($rootScope, logger, backendCommunicator, modalService) {
            const service = {};

            service.bindings = [];

            const BUTTON_NAMES = [
                "A / Cross",
                "B / Circle",
                "X / Square",
                "Y / Triangle",
                "LB / L1",
                "RB / R1",
                "LT / L2",
                "RT / R2",
                "Select / Back",
                "Start / Options",
                "L3 (Left Stick)",
                "R3 (Right Stick)",
                "D-Pad Up",
                "D-Pad Down",
                "D-Pad Left",
                "D-Pad Right",
                "Home / Guide"
            ];

            service.getButtonName = (buttonIndex) => {
                if (buttonIndex == null) return "";
                return BUTTON_NAMES[buttonIndex] ?? `Button ${buttonIndex}`;
            };

            service.loadBindings = () => {
                service.bindings = backendCommunicator.fireEventSync("gamepad:get-bindings") ?? [];
            };

            service.saveBinding = (binding) => {
                if (!binding) return false;
                const saved = backendCommunicator.fireEventSync("gamepad:save-binding", binding);
                if (saved) {
                    const index = service.bindings.findIndex(b => b.id === saved.id);
                    if (index > -1) {
                        service.bindings[index] = saved;
                    } else {
                        service.bindings.push(saved);
                    }
                    return true;
                }
                return false;
            };

            service.saveAllBindings = (bindings) => {
                if (bindings) service.bindings = bindings;
                backendCommunicator.fireEvent("gamepad:save-all-bindings", service.bindings);
            };

            service.deleteBinding = (id) => {
                service.bindings = service.bindings.filter(b => b.id !== id);
                backendCommunicator.fireEvent("gamepad:delete-binding", id);
            };

            service.toggleBindingActiveState = (binding) => {
                if (binding) {
                    binding.active = !binding.active;
                    service.saveBinding(binding);
                }
            };

            service.bindingExists = (bindingId, button, gamepadIndex) => {
                return service.bindings.some(
                    b => b.button === button &&
                         b.gamepadIndex === gamepadIndex &&
                         b.id !== bindingId
                );
            };

            service.showAddEditBindingModal = (binding) => {
                modalService.showModal({
                    component: "AddOrEditGamepadBindingModal",
                    size: "mdlg",
                    keyboard: false,
                    resolveObj: {
                        binding: () => binding
                    },
                    closeCallback: () => {}
                });
            };

            backendCommunicator.on("gamepad:all-bindings-updated", (bindings) => {
                service.bindings = bindings ?? [];
            });

            // Polling
            service.isCapturingButton = false;
            let prevButtonStates = {};
            let animFrameId = null;
            let captureCallback = null;

            const pollGamepads = () => {
                const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

                for (let gi = 0; gi < gamepads.length; gi++) {
                    const gp = gamepads[gi];
                    if (!gp) continue;

                    if (!prevButtonStates[gi]) {
                        prevButtonStates[gi] = new Array(gp.buttons.length).fill(false);
                    }

                    for (let bi = 0; bi < gp.buttons.length; bi++) {
                        const pressed = gp.buttons[bi].pressed;
                        const wasPressed = prevButtonStates[gi][bi];

                        if (pressed && !wasPressed) {
                            if (service.isCapturingButton) {
                                service.isCapturingButton = false;
                                $rootScope.$broadcast("gamepad:capture:update", {
                                    gamepadIndex: gi,
                                    buttonIndex: bi
                                });
                                if (typeof captureCallback === "function") {
                                    captureCallback(gi, bi);
                                    captureCallback = null;
                                }
                                $rootScope.$applyAsync();
                            } else {
                                backendCommunicator.send("gamepad:button-pressed", {
                                    gamepadIndex: gi,
                                    buttonIndex: bi
                                });
                            }
                        }

                        prevButtonStates[gi][bi] = pressed;
                    }
                }

                animFrameId = requestAnimationFrame(pollGamepads);
            };

            service.startPolling = () => {
                if (animFrameId == null) {
                    prevButtonStates = {};
                    animFrameId = requestAnimationFrame(pollGamepads);
                    logger.info("Gamepad polling started");
                }
            };

            service.startCapture = (callback) => {
                captureCallback = callback;
                service.isCapturingButton = true;
            };

            service.cancelCapture = () => {
                service.isCapturingButton = false;
                captureCallback = null;
            };

            return service;
        });
}());

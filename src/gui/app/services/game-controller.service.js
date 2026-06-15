"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("gameControllerService", function($rootScope, logger, backendCommunicator, modalService) {
            const service = {};

            service.bindings = [];

            service.getButtonName = (buttonIndex) => {
                if (buttonIndex == null) {
                    return "";
                }
                return `Button ${buttonIndex + 1}`;
            };

            service.loadBindings = () => {
                service.bindings = backendCommunicator.fireEventSync("game-controller:get-bindings") ?? [];
            };

            service.saveBinding = (binding) => {
                if (!binding) {
                    return false;
                }
                const saved = backendCommunicator.fireEventSync("game-controller:save-binding", binding);
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
                if (bindings) {
                    service.bindings = bindings;
                }
                backendCommunicator.fireEvent("game-controller:save-all-bindings", service.bindings);
            };

            service.deleteBinding = (id) => {
                service.bindings = service.bindings.filter(b => b.id !== id);
                backendCommunicator.fireEvent("game-controller:delete-binding", id);
            };

            service.toggleBindingActiveState = (binding) => {
                if (binding) {
                    binding.active = !binding.active;
                    service.saveBinding(binding);
                }
            };

            service.bindingExists = (bindingId, button, controllerIndex) => {
                return service.bindings.some(
                    b => b.button === button &&
                         b.controllerIndex === controllerIndex &&
                         b.id !== bindingId
                );
            };

            service.showAddEditBindingModal = (binding) => {
                modalService.showModal({
                    component: "AddOrEditGameControllerBindingModal",
                    size: "mdlg",
                    keyboard: false,
                    resolveObj: {
                        binding: () => binding
                    },
                    closeCallback: () => {}
                });
            };

            backendCommunicator.on("game-controller:all-bindings-updated", (bindings) => {
                service.bindings = bindings ?? [];
            });

            // Polling
            // Polling is intentionally decoupled from the display refresh rate (via setTimeout rather
            // than requestAnimationFrame) and adapts its rate based on whether a controller is actually
            // present, so idle systems with no controller plugged in pay almost no ongoing cost.
            const ACTIVE_POLL_INTERVAL_MS = 50; // ~20Hz, plenty for discrete button-press triggers
            const IDLE_POLL_INTERVAL_MS = 1000; // just frequent enough to notice a newly connected controller

            service.isCapturingButton = false;
            let prevButtonStates = {};
            let pollTimeoutId = null;
            let captureCallback = null;

            const hasMatchingBinding = (controllerIndex, buttonIndex) => service.bindings.some(b =>
                b.active &&
                b.button === buttonIndex &&
                (b.controllerIndex == null || b.controllerIndex === controllerIndex)
            );

            const pollControllers = () => {
                const controllers = navigator.getGamepads ? navigator.getGamepads() : [];
                let anyConnected = false;

                for (let ci = 0; ci < controllers.length; ci++) {
                    const controller = controllers[ci];
                    if (!controller) {
                        delete prevButtonStates[ci];
                        continue;
                    }
                    anyConnected = true;

                    if (!prevButtonStates[ci]) {
                        prevButtonStates[ci] = new Array(controller.buttons.length).fill(false);
                    }

                    for (let bi = 0; bi < controller.buttons.length; bi++) {
                        const pressed = controller.buttons[bi].pressed;
                        const wasPressed = prevButtonStates[ci][bi];

                        if (pressed && !wasPressed) {
                            if (service.isCapturingButton) {
                                service.isCapturingButton = false;
                                $rootScope.$broadcast("game-controller:capture:update", {
                                    controllerIndex: ci,
                                    buttonIndex: bi
                                });
                                if (typeof captureCallback === "function") {
                                    captureCallback(ci, bi);
                                    captureCallback = null;
                                }
                                $rootScope.$applyAsync();
                            } else if (hasMatchingBinding(ci, bi)) {
                                backendCommunicator.send("game-controller:button-pressed", {
                                    controllerIndex: ci,
                                    buttonIndex: bi
                                });
                            }
                        }

                        prevButtonStates[ci][bi] = pressed;
                    }
                }

                const nextInterval = (anyConnected || service.isCapturingButton)
                    ? ACTIVE_POLL_INTERVAL_MS
                    : IDLE_POLL_INTERVAL_MS;
                pollTimeoutId = setTimeout(pollControllers, nextInterval);
            };

            service.startPolling = () => {
                if (pollTimeoutId == null) {
                    prevButtonStates = {};
                    pollTimeoutId = setTimeout(pollControllers, IDLE_POLL_INTERVAL_MS);
                    logger.info("Game controller polling started");
                }
            };

            service.startCapture = (callback) => {
                captureCallback = callback;
                service.isCapturingButton = true;
                // Poll immediately so the active-rate kicks in right away instead of
                // waiting for the next (potentially up-to-1s-away) idle-rate tick.
                if (pollTimeoutId != null) {
                    clearTimeout(pollTimeoutId);
                    pollControllers();
                }
            };

            service.cancelCapture = () => {
                service.isCapturingButton = false;
                captureCallback = null;
            };

            return service;
        });
}());

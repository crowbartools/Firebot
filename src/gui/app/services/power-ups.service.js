"use strict";

(function () {

    angular
        .module("firebotApp")
        .factory("powerUpsService", function ($q,
            backendCommunicator, utilityService) {
            const service = {};

            service.powerUps = [];

            service.userIsEligible = false;

            service.selectedSortTag = null;

            service.searchQuery = "";

            function updatePowerUp(powerUp) {
                const index = service.powerUps.findIndex(p => p.id === powerUp.id);
                if (index > -1) {
                    service.powerUps[index] = powerUp;
                } else {
                    service.powerUps.push(powerUp);
                }
            }

            service.loadPowerUps = () => {
                service.powerUps = backendCommunicator.fireEventSync("get-power-ups");
                service.userIsEligible = backendCommunicator.fireEventSync("get-power-ups-eligibility");
            };

            service.savePowerUp = (powerUp) => {
                return $q.when(backendCommunicator.fireEventAsync("save-power-up", powerUp))
                    .then((savedPowerUp) => {
                        if (savedPowerUp) {
                            updatePowerUp(savedPowerUp);
                            return true;
                        }
                        return false;
                    });
            };

            service.saveAllPowerUps = (powerUps) => {
                service.powerUps = powerUps;
                backendCommunicator.fireEvent("save-all-power-ups", powerUps);
            };

            service.showEditPowerUpModal = (powerUp) => {
                utilityService.showModal({
                    component: "editPowerUp",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        powerUp: () => powerUp
                    },
                    closeCallback: () => { }
                });
            };

            service.manuallyTriggerPowerUp = (itemId) => {
                backendCommunicator.fireEvent("manually-trigger-power-up", itemId);
            };

            let currentlySyncing = false;
            service.syncPowerUps = () => {
                if (currentlySyncing) {
                    return;
                }

                currentlySyncing = true;

                $q.when(backendCommunicator.fireEventAsync("sync-power-ups"))
                    .then((powerUps) => {
                        if (powerUps) {
                            service.powerUps = powerUps;
                        }
                        currentlySyncing = false;
                    });
            };

            backendCommunicator.on("power-ups-updated", (powerUps) => {
                service.powerUps = powerUps;
            });

            backendCommunicator.on("power-ups-eligibility-changed", (eligible) => {
                service.userIsEligible = eligible;
            });

            backendCommunicator.on("power-up-updated", (powerUp) => {
                updatePowerUp(powerUp);
            });

            return service;
        });
}());

"use strict";

(function () {

    angular
        .module("firebotApp")
        .factory("powerUpsService", function ($q,
            backendCommunicator, utilityService) {
            const service = {};

            service.powerUps = [];

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
                service.powerUps = backendCommunicator.fireEventSync("power-ups:get-all");
            };

            service.savePowerUp = (powerUp) => {
                return $q.when(backendCommunicator.fireEventAsync("power-ups:save", powerUp))
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
                backendCommunicator.fireEvent("power-ups:save-all", powerUps);
            };

            service.showEditPowerUpModal = (powerUp) => {
                utilityService.showModal({
                    component: "editPowerUp",
                    breadcrumbName: "Edit Power-Up",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        powerUp: () => powerUp
                    },
                    closeCallback: () => { }
                });
            };

            service.manuallyTriggerPowerUp = (itemId) => {
                backendCommunicator.fireEvent("power-ups:manually-trigger", itemId);
            };

            let currentlySyncing = false;
            service.syncPowerUps = () => {
                if (currentlySyncing) {
                    return;
                }

                currentlySyncing = true;

                $q.when(backendCommunicator.fireEventAsync("power-ups:sync"))
                    .then((powerUps) => {
                        if (powerUps) {
                            service.powerUps = powerUps;
                        }
                        currentlySyncing = false;
                    });
            };

            backendCommunicator.on("power-ups:updated-all", (powerUps) => {
                service.powerUps = powerUps;
            });

            backendCommunicator.on("power-ups:updated", (powerUp) => {
                updatePowerUp(powerUp);
            });

            return service;
        });
}());

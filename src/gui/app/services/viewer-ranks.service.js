"use strict";

(function() {
    /** @typedef {import("../../../types/ranks").RankLadder} RankLadder */
    /** @typedef {import("../../../types/ranks").Rank} Rank */

    angular
        .module("firebotApp")
        .factory("viewerRanksService", function($q, backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            /** @type {RankLadder[]} */
            service.rankLadders = [];

            /**
             * @param {RankLadder} ladder
             * @returns {void}
             */
            const updateLadder = (ladder) => {
                const index = service.rankLadders.findIndex(m => m.id === ladder.id);
                if (index > -1) {
                    service.rankLadders[index] = ladder;
                } else {
                    service.rankLadders.push(ladder);
                }
            };

            service.loadRankLadders = async () => {
                const rankLadders = await backendCommunicator.fireEventAsync("rank-ladders:get-all");

                if (rankLadders) {
                    service.rankLadders = rankLadders;
                }
            };

            backendCommunicator.on("rank-ladders:updated", () => {
                service.loadRankLadders();
            });

            /**
             * @param {string} ladderId
             * @returns {RankLadder}
             */
            service.getRankLadder = (ladderId) => {
                return service.rankLadders.find(l => l.id === ladderId);
            };

            /**
             * @param {string} name
             * @returns {RankLadder}
             */
            service.getRankLadderByName = (name) => {
                return service.rankLadders.find(l => l.name === name);
            };

            /**
             * @param {RankLadder} ladder
             * @returns {Promise.<void>}
             */
            service.saveRankLadder = async (ladder) => {
                const savedLadder = await backendCommunicator.fireEventAsync("rank-ladders:save", JSON.parse(angular.toJson(ladder)));

                if (savedLadder) {
                    updateLadder(savedLadder);
                    return true;
                }

                return false;
            };

            service.saveAllRankLadders = function(ladders) {
                service.rankLadders = ladders;
                backendCommunicator.fireEvent("rank-ladders:save-all", JSON.parse(angular.toJson(ladders)));
            };

            service.deleteRankLadder = function(ladderId) {
                service.rankLadders = service.rankLadders.filter(t => t.id !== ladderId);
                backendCommunicator.fireEvent("rank-ladders:delete", ladderId);
            };

            service.duplicateRankLadder = (ladderId) => {
                const ladder = service.rankLadders.find(t => t.id === ladderId);
                if (ladder == null) {
                    return;
                }
                const copiedLadder = objectCopyHelper.copyObject("rank ladder", ladder);
                copiedLadder.id = null;

                while (service.rankLadders.some(t => t.name === copiedLadder.name)) {
                    copiedLadder.name += " copy";
                }

                service.saveRankLadder(copiedLadder)
                    .then((successful) => {
                        if (successful) {
                            ngToast.create({
                                className: 'success',
                                content: 'Successfully duplicated rank ladder!'
                            });
                        } else {
                            ngToast.create("Unable to duplicate rank ladder.");
                        }
                    });
            };

            /**
             * @param {RankLadder} [rankLadder]
             * @returns {void}
             */
            service.showAddOrEditRankLadderModal = (rankLadder, closeCb) => {
                utilityService.showModal({
                    component: "addOrEditRankLadderModal",
                    size: "md",
                    resolveObj: {
                        rankLadder: () => rankLadder
                    },
                    closeCallback: closeCb,
                    dismissCallback: closeCb
                });
            };

            /**
             * @param {RankLadder} [rankLadder]
             * @returns {void}
             */
            service.showRecalculateRanksModal = (rankLadder) => {
                utilityService.showModal({
                    component: "recalculateRanksModal",
                    size: "sm",
                    keyboard: false,
                    backdrop: "static",
                    resolveObj: {
                        rankLadder: () => rankLadder
                    }
                });
            };

            service.ladderModes = [
                {
                    id: "auto",
                    name: "Automated",
                    description: "Viewers are automatically added to ranks based on view time or currency.",
                    iconClass: "fa-magic"
                },
                {
                    id: "manual",
                    name: "Manual",
                    description: "Viewers must be manually added to ranks in the UI or via the Set Rank effect.",
                    iconClass: "fa-users-cog"
                }
            ];

            return service;
        });
})();
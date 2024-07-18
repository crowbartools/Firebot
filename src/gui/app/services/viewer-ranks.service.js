"use strict";

(function() {
    /** @typedef {import("../../../types/ranks").RankLadder} RankLadder */
    /** @typedef {import("../../../types/ranks").Rank} Rank */

    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("viewerRanksService", function($q, backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            /** @type {RankLadder[]} */
            service.rankLadders = [];

            service.loadRankLadders = async function() {
                $q.when(backendCommunicator.fireEventAsync("getRankLadders")).then((ladders) => {
                    if (ladders != null && Array.isArray(ladders)) {
                        service.rankLadders = ladders;
                    }
                });
            };

            service.saveAllRankLadders = function(ladders) {
                service.rankLadders = ladders;
                backendCommunicator.fireEventAsync("saveAllRankLadders", JSON.parse(angular.toJson(ladders)));
            };

            service.saveRankLadder = function(ladder) {
                if (ladder.id == null) {
                    ladder.id = uuid();
                    ladder.enabled = ladder.enabled ?? true;
                    ladder.ranks = ladder.ranks ?? [];
                }

                backendCommunicator.fireEventAsync("saveRankLadder", JSON.parse(angular.toJson(ladder)));

                const existingLadderIndex = service.rankLadders.findIndex(t => t.id === ladder.id);
                if (existingLadderIndex !== -1) {
                    service.rankLadders[existingLadderIndex] = ladder;
                } else {
                    service.rankLadders.push(ladder);
                }
            };

            service.deleteRankLadder = function(ladderId) {
                backendCommunicator.fireEventAsync("deleteRankLadder", ladderId);
                service.rankLadders = service.rankLadders.filter(t => t.id !== ladderId);
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

                service.saveRankLadder(copiedLadder);

                ngToast.create({
                    className: 'success',
                    content: 'Successfully duplicated a rank ladder!'
                });
            };

            service.getRankLadderByName = (ladderName) => {
                return service.rankLadders.find(t => t.name === ladderName);
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
                    description: "Viewers must be manually added to ranks via rank command or Set Rank effect.",
                    iconClass: "fa-users-cog"
                }
            ];

            service.showAddRankLadderModal = (rankLadder) => {
                utilityService.showModal({
                    component: "addOrEditRankLadderModal",
                    size: "md",
                    resolveObj: {
                        rankLadder: () => rankLadder
                    }
                });
            };

            return service;
        });
}());
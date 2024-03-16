"use strict";

(function() {
    const uuid = require("uuid/v4");

    angular
        .module("firebotApp")
        .factory("viewerRanksService", function($q, backendCommunicator, objectCopyHelper, ngToast) {
            const service = {};

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

            service.ladderTypes = [
                {
                    id: "manual",
                    display: "Manual",
                    description: "Viewers must be manually added to ranks (!rank command, Set Rank effect, etc.)",
                    iconClass: "fa-users-cog"
                },
                {
                    id: "automated",
                    display: "Automated",
                    description: "Viewers are automatically added to ranks based on criteria (currency or time watched)",
                    iconClass: "fa-magic"
                }
            ];

            return service;
        });
}());
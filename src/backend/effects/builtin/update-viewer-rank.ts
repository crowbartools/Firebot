"use strict";

import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import viewerDatabase from "../../viewers/viewer-database";
import viewerRanksService from "../../ranks/rank-manager";

const model: EffectType<{
    rankLadderId: string;
    action: "promote" | "demote" | "set-specific-rank" | "set-variable-rank";
    rankId?: string;
    variableRankName?: string;
}> = {
    definition: {
        id: "firebot:update-viewer-rank",
        name: "Update Viewer Rank",
        description: "Update a viewers rank within a given rank ladder",
        icon: "fad fa-award",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container header="Rank Ladder">
        <firebot-searchable-select
            items="manualRankLadders"
            ng-model="effect.rankLadderId"
            placeholder="Select rank ladder"
        >
        </firebot-searchable-select>

        <div class="effect-info alert alert-info">
            Note: only rank ladders set to "Manual" mode are available for this effect.
        </div>
    </eos-container>

    <eos-container header="Action" ng-show="effect.rankLadderId != null">
        <firebot-radios
            options="actions"
            model="effect.action"
        >
        </firebot-radios>
    </eos-container>

    <eos-container header="New Rank" ng-show="effect.action === 'set-specific-rank' || effect.action === 'set-variable-rank'">
        <firebot-input
            ng-if="effect.action === 'set-variable-rank'"
            model="effect.variableRankName"
            placeholder="Enter rank name"
        ></firebot-input>
        <firebot-searchable-select
            ng-if="effect.action === 'set-specific-rank'"
            items="getRanksForSelectedLadder()"
            ng-model="effect.rankId"
            placeholder="Select rank"
        >
        </firebot-searchable-select>
    </eos-container>
    `,
    optionsController: ($scope, viewerRanksService) => {
        $scope.manualRankLadders = viewerRanksService.rankLadders
            .filter(ladder => ladder.mode === "manual");

        $scope.actions = {
            promote: "Promote To Next Rank",
            demote: "Demote To Previous Rank",
            "set-specific-rank": "Set Specific Rank",
            "set-variable-rank": "Set Variable Rank"
        };

        $scope.getRanksForSelectedLadder = () => {
            if (!$scope.effect.rankLadderId) {
                return [];
            }
            const ladder = $scope.manualRankLadders.find(ladder =>
                ladder.id === $scope.effect.rankLadderId
            );
            return ladder ? ladder.ranks : [];
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!effect.rankLadderId) {
            errors.push("Please select a Rank Ladder");
        }
        if (!effect.action) {
            errors.push("Please select an change action");
        } else if (effect.action === "set-specific-rank" && !effect.rankId) {
            errors.push("Please select a Rank");
        } else if (effect.action === "set-variable-rank" && !effect.variableRankName) {
            errors.push("Please enter a Rank Name");
        }
        return errors;
    },
    getDefaultLabel: (effect, viewerRanksService) => {
        const ladder = viewerRanksService.getRankLadder(effect.rankLadderId);
        if (!ladder) {
            return "";
        }
        switch (effect.action) {
            case "promote":
                return `Promote Viewer in ${ladder.name}`;
            case "demote":
                return `Demote Viewer in ${ladder.name}`;
            case "set-specific-rank": {
                const rank = ladder.ranks.find(r => r.id === effect.rankId);
                return `${ladder.name} - ${rank?.name ?? "Unknown Rank"}`;
            }
            case "set-variable-rank":
                return `${ladder.name} - ${effect.variableRankName}`;
        }
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        const ladder = viewerRanksService.getRankLadderHelpers().find(ladder =>
            ladder.id === effect.rankLadderId
        );

        if (!ladder) {
            return false;
        }

        const viewer = await viewerDatabase.getViewerByUsername(trigger.metadata.username);

        if (!viewer) {
            return false;
        }

        const currentRankId = viewer.ranks?.[ladder.id] ?? null;

        let newRankId: string = null;
        switch (effect.action) {
            case "promote":
                newRankId = ladder.getNextRankId(currentRankId);
                if (!newRankId) {
                    // viewer is already at the highest rank
                    return true;
                }
                break;
            case "demote":
                newRankId = ladder.getPreviousRankId(currentRankId);
                break;
            case "set-specific-rank":
                if (!ladder.hasRank(effect.rankId)) {
                    return false;
                }
                newRankId = effect.rankId;
                break;
            case "set-variable-rank": {
                const rank = ladder.getRankByName(effect.variableRankName);
                if (!rank) {
                    return false;
                }
                newRankId = rank.id;
                break;
            }
        }

        if (newRankId === currentRankId) {
            return true;
        }

        await viewerDatabase.setViewerRank(viewer, ladder.id, newRankId);
    }
};

module.exports = model;

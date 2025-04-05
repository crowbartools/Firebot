"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const { abortEffectList, abortEffect, abortAllEffectLists } = require("../../common/effect-abort-helpers");

const effectQueueRunner = require("../queues/effect-queue-runner").default;

const model = {
    definition: {
        id: "firebot:stop-effect-execution",
        name: "Stop Effect Execution",
        description: "Stop the execution of the current effect list.",
        icon: "fad fa-stop-circle",
        categories: [EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Target">
            <firebot-radios
                options="targetOptions"
                model="effect.target"
            />
        </eos-container>

        <eos-container header="Effect List" ng-if="effect.target === 'specificList'" pad-top="true">
            <firebot-input
                input-title="Effect List ID"
                title-tooltip="You can copy the ID of an effect list via its three-dot menu in the top right corner"
                model="effect.listId"
                placeholder-text="Enter ID"
                data-type="text"
            />
        </eos-container>

        <eos-container header="Effect" ng-if="effect.target === 'specificEffect'" pad-top="true">
            <firebot-input
                input-title="Effect ID"
                title-tooltip="You can copy the ID of an effect via its three-dot menu"
                model="effect.effectId"
                placeholder-text="Enter ID"
                data-type="text"
            />
        </eos-container>

        <eos-container header="Queue" ng-if="effect.target === 'queueActiveEffectLists'" pad-top="true">
            <firebot-searchable-select
                ng-model="effect.queueId"
                placeholder="Select queue"
                items="queueOptions"
            />
        </eos-container>

        <eos-container
            header="Options"
            ng-if="effect.target !== 'specificEffect'"
            pad-top="true"
        >
            <firebot-checkbox
                label="Bubble to parent effect lists"
                tooltip="Bubble the stop effect execution request to all parent effect lists (useful if nested within a conditional effect, etc)"
                model="effect.bubbleStop"
            />
        </eos-container>
    `,
    optionsController: ($scope, effectQueuesService) => {

        $scope.targetOptions = {
            currentList: { text: "Current effect list", description: "Stops execution of the effect list that this effect resides in" },
            specificList: { text: "Specific effect list", description: "Abort the execution of a specific effect list by its ID" },
            queueActiveEffectLists: { text: "Active effect lists for queue", description: "Abort the execution of active effect lists from a queue" },
            allActiveEffectLists: { text: "All active effect lists", description: "Abort the execution of all actively running effect lists" },
            specificEffect: { text: "Specific effect", description: "Abort the execution of a specific effect by its ID" }
        };

        $scope.queueOptions = [
            { id: "all", name: "All queues" },
            ...(effectQueuesService.getEffectQueues() ?? [])
        ];

        if ($scope.effect.target == null) {
            $scope.effect.target = "currentList";
        }
    },
    optionsValidator: (effect) => {
        const errors = [];

        if (effect.target === "specificList" && !effect.listId) {
            errors.push("Please provide an effect list ID");
        }

        if (effect.target === "specificEffect" && !effect.effectId) {
            errors.push("Please provide an effect ID");
        }

        if (effect.target === "queueActiveEffectLists" && !effect.queueId) {
            errors.push("Please select a queue");
        }

        return errors;
    },
    getDefaultLabel: (effect, effectQueuesService) => {
        switch (effect.target) {
            case "currentList":
                return "Current effect list";
            case "specificList":
                return `Specific effect list)`;
            case "specificEffect":
                return `Specific effect`;
            case "queueActiveEffectLists":
                if (effect.queueId === "all") {
                    return "Active Effect Lists for All Queues";
                }
                return `Active Effect Lists for Queue ${effectQueuesService.getEffectQueue(effect.queueId)?.name ?? "Unknown Queue"}`;
            case "allActiveEffectLists":
                return "All active effect lists";
        }
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        if (effect.target == null || effect.target === "currentList") {
            return {
                success: true,
                execution: {
                    stop: true,
                    bubbleStop: effect.bubbleStop === true
                }
            };
        }

        if (effect.target === "specificList") {
            abortEffectList(effect.listId, effect.bubbleStop === true);
        } else if (effect.target === "specificEffect") {
            abortEffect(effect.effectId);
        } else if (effect.target === "queueActiveEffectLists") {
            if (effect.queueId === "all") {
                effectQueueRunner.abortActiveEffectListsForAllQueues(effect.bubbleStop === true);
            } else {
                effectQueueRunner.abortActiveEffectListsForQueue(effect.queueId, effect.bubbleStop === true);
            }
        } else if (effect.target === "allActiveEffectLists") {
            abortAllEffectLists(effect.bubbleStop === true);
        }

        return true;
    }
};

module.exports = model;

"use strict";

const timerManager = require("../../timers/timer-manager");
const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:toggle-timer",
        name: "Toggle Timer",
        description: "Toggle a timer's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect let's you automatically toggle the active status of Timers.</p>
        </eos-container>

        <eos-container ng-hide="hasTimers" pad-top="true">
            <span class="muted">No Timers created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasTimers" header="Timer" pad-top="true">
            <dropdown-select options="timerOptions" selected="effect.selectedTimerId"></dropdown-select>
        </eos-container>

        <eos-container ng-show="hasTimers" header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, timerService) => {

        const timers = timerService.getTimers();

        $scope.timerOptions = {};

        for (const timer of timers) {
            $scope.timerOptions[timer.id] = timer.name;
        }

        $scope.hasTimers = timers != null && timers.length > 0;

        if ($scope.timerOptions[$scope.effect.selectedTimerId] == null) {
            $scope.effect.selectedTimerId = undefined;
        }

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate",
            toggle: "Toggle"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: effect => {
        const errors = [];
        if (effect.selectedTimerId == null) {
            errors.push("Please select a timer.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;
        const timer = timerManager.getItem(effect.selectedTimerId);
        const isActive = effect.toggleType === "toggle" ? !timer.active : effect.toggleType === "enable";

        timerManager.updateTimerActiveStatus(effect.selectedTimerId, isActive);

        return true;
    }
};

module.exports = chat;

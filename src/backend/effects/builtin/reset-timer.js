"use strict";

const timerManager = require("../../timers/timer-manager");
const { EffectCategory } = require('../../../shared/effect-constants');

const chat = {
    definition: {
        id: "firebot:reset-timer",
        name: "Reset Timer",
        description: "Force a timer to restart its interval",
        icon: "fad fa-stopwatch",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <p>This effect let's you force a timer to restart its interval.</p>
        </eos-container>

        <eos-container ng-hide="hasTimers" pad-top="true">
            <span class="muted">No Timers created yet! You can create them in the <b>Timers</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasTimers" header="Timer" pad-top="true">
            <dropdown-select options="timerOptions" selected="effect.selectedTimerId"></dropdown-select>
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
    },
    optionsValidator: effect => {
        const errors = [];
        if (effect.selectedTimerId == null) {
            errors.push("Please select a timer.");
        }
        return errors;
    },
    getDefaultLabel: (effect, timerService) => {
        const timer = timerService.getTimers()
            .find(timer => timer.id === effect.selectedTimerId);
        return timer?.name ?? "Unknown Timer";
    },
    onTriggerEvent: async event => {
        const { effect } = event;

        const timer = timerManager.getItem(effect.selectedTimerId);

        if (timer) {
            timerManager.updateIntervalForTimer(timer);
        }

        return true;
    }
};

module.exports = chat;

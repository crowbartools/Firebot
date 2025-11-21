import type { EffectType } from "../../../types/effects";
import type { Timer } from "../../../types/timers";
import { TimerManager } from "../../timers/timer-manager";

const effect: EffectType<{
    selectedTimerId: string;
}> = {
    definition: {
        id: "firebot:reset-timer",
        name: "Reset Timer",
        description: "Force a timer to restart its interval",
        icon: "fad fa-stopwatch",
        categories: ["common", "firebot control"],
        dependencies: []
    },
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
        const timers = timerService.getTimers() as Timer[];

        $scope.timerOptions = {};

        for (const timer of timers) {
            $scope.timerOptions[timer.id] = timer.name;
        }

        $scope.hasTimers = timers != null && timers.length > 0;

        if ($scope.timerOptions[$scope.effect.selectedTimerId] == null) {
            $scope.effect.selectedTimerId = undefined;
        }
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.selectedTimerId == null) {
            errors.push("Please select a timer.");
        }
        return errors;
    },
    getDefaultLabel: (effect, timerService) => {
        const timer = (timerService.getTimers() as Timer[])
            .find(timer => timer.id === effect.selectedTimerId);
        return timer?.name ?? "Unknown Timer";
    },
    onTriggerEvent: ({ effect }) => {
        const timer = TimerManager.getItem(effect.selectedTimerId);

        if (timer) {
            TimerManager.updateIntervalForTimer(timer);
        }

        return true;
    }
};

export = effect;
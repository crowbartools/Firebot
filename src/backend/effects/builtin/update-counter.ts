import { EffectType } from "../../../types/effects";
import { EffectCategory } from '../../../shared/effect-constants';
import { CounterManager } from "../../counters/counter-manager";
import logger from "../../logwrapper";

const model: EffectType<{
    counterId: string;
    mode: string;
    value: string;
}> = {
    definition: {
        id: "firebot:update-counter",
        name: "Update Counter",
        description: "Update a counter's value.",
        icon: "fad fa-tally",
        categories: [EffectCategory.COMMON, EffectCategory.ADVANCED],
        dependencies: []
    },
    optionsTemplate: `
        <div ng-hide="hasCounters">
            <p>You need to create a Counter to use this effect! Go to the <b>Counters</b> tab to create one.</p>
        </div>
        <div ng-show="hasCounters">
            <eos-container header="Counter">
                <dropdown-select options="counters" selected="effect.counterId"></dropdown-select>
            </eos-container>

            <div ng-show="effect.counterId">
                <eos-container header="Mode" pad-top="true">
                    <div class="controls-fb" style="padding-bottom: 5px;">
                        <label class="control-fb control--radio">Increment <tooltip text="'Increment the counter by the given value (value can be negative to decrement)'"></tooltip>
                            <input type="radio" ng-model="effect.mode" value="increment"/>
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--radio">Set <tooltip text="'Set the counter to a new value.'"></tooltip>
                            <input type="radio" ng-model="effect.mode" value="set"/>
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </eos-container>
            </div>

            <eos-container header="{{effect.mode == 'increment' ? 'Increment Amount' : 'New Value'}}" pad-top="true" ng-show="effect.mode">
                <div class="input-group">
                    <span class="input-group-addon" id="delay-length-effect-type">Value</span>
                    <input ng-model="effect.value" type="text" class="form-control" aria-describedby="delay-length-effect-type" type="text" replace-variables="number">
                </div>
            </eos-container>
        </div>
    `,
    optionsController: ($scope, countersService) => {

        $scope.hasCounters = countersService.counters.length > 0;

        $scope.counters = {};
        for (const counter of countersService.counters) {
            $scope.counters[counter.id] = counter.name;
        }

        if ($scope.effect.value === undefined) {
            $scope.effect.value = "1";
        }

    },
    optionsValidator: (effect, $scope) => {
        const errors = [];
        if (effect.counterId == null) {
            errors.push("Please select a counter.");
        } else if (effect.mode == null) {
            errors.push("Please select an update mode.");
        } else if (effect.value === undefined || effect.value === "") {
            errors.push("Please enter an update value.");
        }

        if ($scope.triggerType === 'counter') {
            if ($scope.triggerMeta && $scope.triggerMeta.counterEffectListType === 'update' && effect.counterId === $scope.triggerMeta.triggerId) {
                errors.push("You can't make a counter update itself. Doing so would cause an infinite loop.");
            }
        }

        return errors;
    },
    getDefaultLabel: (effect, countersService) => {
        const counterName = countersService.getCounter(effect.counterId)?.name ?? "Unknown Counter";
        return `${effect.mode === "increment" ? "Update" : "Set"} ${counterName} ${effect.mode === "increment" ? "by" : "to"} ${effect.value}`;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;

        if (effect.counterId == null || effect.mode == null || effect.value == null) {
            return false;
        }

        const value = parseInt(effect.value);

        if (isNaN(value)) {
            logger.warn(`Failed to update Counter ${effect.counterId} because ${effect.value} is not a number.`);
            return false;
        }

        await CounterManager.updateCounterValue(effect.counterId, value, effect.mode === "set");

        return true;
    }
};

export = model;
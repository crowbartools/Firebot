import timerManager from "../../timers/timer-manager";
import {EffectCategory} from "../../../shared/effect-constants";
import {EffectType} from "../../../types/effects";

const model: EffectType<{
    selectedTimerId?: string;
    toggleType: "toggle" | "enable" | "disable";
    useTag?: boolean;
    sortTagId?: string;
}> = {
    definition: {
        id: "firebot:toggle-timer",
        name: "Toggle Timer",
        description: "Toggle a timer's active status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect lets you automatically toggle the active status of Timers.</p>
        </eos-container>

        <eos-container ng-hide="!hasTags">
            <label class="control-fb control--checkbox"> Use Sort Tags</tooltip>
                <input type="checkbox" ng-model="effect.useTag">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container ng-hide="hasTimers || effect.useTag" pad-top="true">
            <span class="muted">No Timers created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-hide="hasTags || !effect.useTag" pad-top="true">
            <span class="muted">No Timer Tags created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasTimers && !effect.useTag" header="Timer" pad-top="true">
            <dropdown-select options="timerOptions" selected="effect.selectedTimerId"></dropdown-select>
        </eos-container>

        <eos-container ng-show="hasTags && effect.useTag" header="Tag" pad-top="true">
            <ui-select ng-model="effect.sortTagId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a tag... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="sortTag.id as sortTag in sortTags | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="sortTag.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="hasTimers || (hasTags && effect.useTag)" header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, timerService, sortTagsService) => {

        const timers = timerService.getTimers();

        $scope.sortTags = sortTagsService.getSortTags('timers');

        $scope.timerOptions = {};

        for (const timer of timers) {
            $scope.timerOptions[timer.id] = timer.name;
        }

        $scope.hasTimers = timers != null && timers.length > 0;
        $scope.hasTags = $scope.sortTags != null && $scope.sortTags.length > 0;

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
    optionsValidator: (effect) => {
        const errors = [];
        if (!effect.useTag && effect.selectedTimerId == null) {
            errors.push("Please select a timer.");
        }
        if (effect.useTag && effect.sortTagId == null) {
            errors.push("Please select a timer sort tag.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;
        if (!effect.useTag) {
            const timer = timerManager.getItem(effect.selectedTimerId);
            const isActive = effect.toggleType === "toggle" ? !timer.active : effect.toggleType === "enable";

            timerManager.updateTimerActiveStatus(effect.selectedTimerId, isActive);

            return true;
        }
        const timers = timerManager.getAllItems().filter(timer => timer.sortTags?.includes(effect.sortTagId));
        timers.forEach((timer) => {
            const isActive = effect.toggleType === "toggle" ? !timer.active : effect.toggleType === "enable";
            timerManager.updateTimerActiveStatus(timer.id, isActive);
        });

        return true;
    }
};

export = model;
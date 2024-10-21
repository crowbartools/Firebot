import { EffectType } from "../../../types/effects";
import { EffectCategory } from '../../../shared/effect-constants';
import scheduledTaskManager from "../../timers/scheduled-task-manager";

const model: EffectType<{
    scheduledTaskId: string;
    toggleType: "toggle" | "enable" | "disable";
    useTag?: boolean;
    sortTagId?: string;
}> = {
    definition: {
        id: "firebot:toggle-scheduled-task",
        name: "Toggle Scheduled Effect List",
        description: "Toggle a scheduled effect list's enabled status",
        icon: "fad fa-toggle-off",
        categories: [EffectCategory.COMMON],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect lets you automatically toggle the enabled status of Scheduled Effect Lists.</p>
        </eos-container>

        <eos-container ng-hide="!hasTags">
            <label class="control-fb control--checkbox"> Use Sort Tags</tooltip>
                <input type="checkbox" ng-model="effect.useTag">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container ng-hide="hasScheduledTasks || effect.useTag" pad-top="true">
            <span class="muted">No Scheduled Effect Lists created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-hide="hasTags || !effect.useTag" pad-top="true">
            <span class="muted">No Timer Tags created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasScheduledTasks && !effect.useTag" header="Scheduled Effect List" pad-top="true">
            <dropdown-select options="scheduledTaskOptions" selected="effect.scheduledTaskId"></dropdown-select>
        </eos-container>

        <eos-container ng-show="hasTags && effect.useTag" header="Tag" pad-top="true">
            <ui-select ng-model="effect.sortTagId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a tag... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="sortTag.id as sortTag in sortTags | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="sortTag.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="hasScheduledTasks || (hasTags && effect.useTag)" header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, scheduledTaskService, sortTagsService) => {

        const scheduledTasks = scheduledTaskService.getScheduledTasks();

        $scope.sortTags = sortTagsService.getSortTags('scheduled effect lists');

        $scope.scheduledTaskOptions = {};

        for (const scheduledTask of scheduledTasks) {
            $scope.scheduledTaskOptions[scheduledTask.id] = scheduledTask.name;
        }

        $scope.hasScheduledTasks = scheduledTasks != null && scheduledTasks.length > 0;
        $scope.hasTags = $scope.sortTags != null && $scope.sortTags.length > 0;

        if ($scope.scheduledTaskOptions[$scope.effect.scheduledTaskId] == null) {
            $scope.effect.scheduledTaskId = undefined;
        }

        $scope.toggleOptions = {
            disable: "Disable",
            enable: "Enable",
            toggle: "Toggle"
        };

        if ($scope.effect.toggleType == null) {
            $scope.effect.toggleType = "disable";
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!effect.useTag && effect.scheduledTaskId == null) {
            errors.push("Please select a scheduled effect list.");
        }
        if (effect.useTag && effect.sortTagId == null) {
            errors.push("Please select a scheduled effect list sort tag.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const { effect } = event;
        if (!effect.useTag) {
            const scheduledTask = scheduledTaskManager.getItem(effect.scheduledTaskId);
            scheduledTask.enabled = effect.toggleType === "toggle" ? !scheduledTask.enabled : effect.toggleType === "enable";

            scheduledTaskManager.saveScheduledTask(scheduledTask);

            return true;
        }

        const tasks = scheduledTaskManager.getAllItems().filter(task => task.sortTags?.includes(effect.sortTagId));

        tasks.forEach((scheduledTask) => {
            scheduledTask.enabled = effect.toggleType === "toggle" ? !scheduledTask.enabled : effect.toggleType === "enable";
            scheduledTaskManager.saveScheduledTask(scheduledTask);
        });

        return true;
    }
};

export = model;
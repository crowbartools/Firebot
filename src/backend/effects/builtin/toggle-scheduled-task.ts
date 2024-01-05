import { EffectType } from "../../../types/effects";
import { EffectCategory } from '../../../shared/effect-constants';
import scheduledTaskManager from "../../timers/scheduled-task-manager";

const model: EffectType<{
    scheduledTaskId: string;
    toggleType: string;
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
            <p>This effect let's you automatically toggle the enabled status of Scheduled Effect Lists.</p>
        </eos-container>

        <eos-container ng-hide="hasScheduledTasks" pad-top="true">
            <span class="muted">No Scheduled Effect Lists created yet! You can create them in the <b>Time-Based</b> tab.</span>
        </eos-container>

        <eos-container ng-show="hasScheduledTasks" header="Scheduled Effect List" pad-top="true">
            <dropdown-select options="scheduledTaskOptions" selected="effect.scheduledTaskId"></dropdown-select>
        </eos-container>

        <eos-container ng-show="hasScheduledTasks" header="Toggle Action" pad-top="true">
            <dropdown-select options="toggleOptions" selected="effect.toggleType"></dropdown-select>
        </eos-container>
    `,
    optionsController: ($scope, scheduledTaskService) => {

        const scheduledTasks = scheduledTaskService.getScheduledTasks();

        $scope.scheduledTaskOptions = {};

        for (const scheduledTask of scheduledTasks) {
            $scope.scheduledTaskOptions[scheduledTask.id] = scheduledTask.name;
        }

        $scope.hasScheduledTasks = scheduledTasks != null && scheduledTasks.length > 0;

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
    optionsValidator: effect => {
        const errors = [];
        if (effect.scheduledTaskId == null) {
            errors.push("Please select a scheduled effect list.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;
        const scheduledTask = scheduledTaskManager.getItem(effect.scheduledTaskId);
        scheduledTask.enabled = effect.toggleType === "toggle" ? !scheduledTask.enabled : effect.toggleType === "enable";

        scheduledTaskManager.saveScheduledTask(scheduledTask);

        return true;
    }
};

export = model;
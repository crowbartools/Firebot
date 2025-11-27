import type { EffectType, EffectQueueConfig } from "../../../types/effects";
import { EffectQueueConfigManager } from "../queues/effect-queue-config-manager";
import logger from "../../logwrapper";

const effect: EffectType<{
    effectQueue: string;
    action: "Pause" | "Resume" | "Toggle";
    runEffectsImmediatelyWhenPaused?: boolean;
}> = {
    definition: {
        id: "firebot:pause-effect-queue",
        name: "Pause/Resume Effect Queue",
        description: "Pauses or resumes an effect queue. Effects sent to a paused queue will run once the queue is resumed.",
        icon: "fad fa-pause-circle",
        categories: ["scripting", "firebot control"]
    },
    optionsTemplate: `
        <eos-container header="Effect Queue">
            <div class="btn-group" ng-if="effectQueues.length">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effectQueueName ? effectQueueName : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-repeat="queue in effectQueues" ng-click="selectEffectQueue(queue)">
                        <a href>{{queue.name}}</a>
                    </li>
                </ul>
            </div>
            <div ng-if="!effectQueues.length">
                You have no effect queues saved.
            </div>
        </eos-container>

        <eos-container header="Action" ng-if="effect.effectQueue != null" pad-top="true">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.action ? effect.action : 'Pick One'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.action = 'Pause'">
                        <a href>Pause</a>
                    </li>
                    <li ng-click="effect.action = 'Resume'">
                        <a href>Resume</a>
                    </li>
                    <li ng-click="effect.action = 'Toggle'">
                        <a href>Toggle</a>
                    </li>
                </ul>
            </div>
            <firebot-checkbox
                ng-if="effect.action === 'Pause' || effect.action === 'Toggle'"
                label="Run Effects Immediately When Paused"
                tooltip="When the queue is paused and effects are added to it, run them immediately instead of waiting for the queue to be resumed. This is useful if you want to temporarily pause queue functionality and have effects set to this queue to run as if there was no queue."
                model="effect.runEffectsImmediatelyWhenPaused"
                allow-indeterminate="true"
                style="margin-top: 15px; margin-bottom: 0px;"
            />
        </eos-container>
    `,
    optionsController: ($scope, effectQueuesService) => {
        $scope.effectQueues = effectQueuesService.getEffectQueues();
        $scope.effectQueueName = null;

        if ($scope.effect.effectQueue?.length > 0) {
            const selectedQueue = effectQueuesService.getEffectQueue($scope.effect.effectQueue);
            $scope.effectQueueName = selectedQueue?.name;

            if (selectedQueue == null) {
                $scope.effect.effectQueue = null;
            }
        }

        $scope.selectEffectQueue = (queue: EffectQueueConfig) => {
            $scope.effect.effectQueue = queue.id;
            $scope.effectQueueName = queue.name;
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.effectQueue == null) {
            errors.push("You must select an effect queue");
        } else if (effect.action == null) {
            errors.push("You must select an action");
        }

        return errors;
    },
    getDefaultLabel: (effect, effectQueuesService) => {
        const queue = effectQueuesService.getEffectQueue(effect.effectQueue);
        return `${effect.action} ${queue?.name ?? "Unknown Queue"}`;
    },
    onTriggerEvent: ({ effect }) => {
        const queue = EffectQueueConfigManager.getItem(effect.effectQueue);

        if (queue == null) {
            logger.debug(`Effect queue ${effect.effectQueue} not found`);
            return false;
        }
        if (effect.action === "Pause") {
            EffectQueueConfigManager.pauseQueue(effect.effectQueue, effect.runEffectsImmediatelyWhenPaused);
        } else if (effect.action === "Resume") {
            EffectQueueConfigManager.resumeQueue(effect.effectQueue);
        } else {
            EffectQueueConfigManager.toggleQueue(effect.effectQueue, effect.runEffectsImmediatelyWhenPaused);
        }

        return true;
    }
};

export = effect;
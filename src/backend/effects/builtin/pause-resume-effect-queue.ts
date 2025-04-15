import { EffectType } from "../../../types/effects";
import { EffectCategory } from "../../../shared/effect-constants";
import effectQueueManager, { EffectQueueConfig } from "../queues/effect-queue-config-manager";
import logger from "../../logwrapper";

const model: EffectType<{
    effectQueue: string;
    action: "Pause" | "Resume" | "Toggle";
}> = {
    definition: {
        id: "firebot:pause-effect-queue",
        name: "Pause/Resume Effect Queue",
        description: "Pauses or resumes an effect queue. Effects sent to a paused queue will run once the queue is resumed.",
        icon: "fad fa-pause-circle",
        categories: [EffectCategory.SCRIPTING]
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
        </eos-container>
    `,
    optionsController: ($scope, effectQueuesService: any) => {
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
    onTriggerEvent: async ({ effect }) => {
        const queue = effectQueueManager.getItem(effect.effectQueue);

        if (queue == null) {
            logger.debug(`Effect queue ${effect.effectQueue} not found`);
            return false;
        }
        if (effect.action === "Pause") {
            effectQueueManager.pauseQueue(effect.effectQueue);
        } else if (effect.action === "Resume") {
            effectQueueManager.resumeQueue(effect.effectQueue);
        } else {
            effectQueueManager.toggleQueue(effect.effectQueue);
        }


        return true;
    }
};

module.exports = model;
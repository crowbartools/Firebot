"use strict";

import type {
    FirebotComponent,
    EffectQueueConfig,
    ModalFactory
} from "../../../../../types";

type EffectListWithQueue = {
    queue?: string | null;
    queuePriority?: "high" | "none";
    queueDuration?: number;
};

type EffectQueuesService = {
    getEffectQueues: () => EffectQueueConfig[];
    getEffectQueue: (id: string) => EffectQueueConfig | undefined;
    showAddEditEffectQueueModal: (queueId?: string) => Promise<string>;
    showDeleteEffectQueueModal: (queueId: string) => Promise<boolean>;
};

type QueuePanelBindings = {
    effectsData: EffectListWithQueue;
    onUpdate: () => void;
};

type QueueOption = {
    name: string;
    value: string;
    icon: string;
};

type QueueAction = {
    label: string;
    icon: string;
    type?: "info" | "danger";
    onSelect: () => void;
};

type ControllerExtras = {
    expanded: boolean;
    animationComplete: boolean;
    eqs: EffectQueuesService;
    getSelectedEffectQueueName: () => string;
    getSelectedQueuePriority: () => string;
    getSelectedQueueModeIsCustom: () => boolean;
    toggleQueueSelection: (queueId: string) => void;
    validQueueSelected: () => boolean;
    showAddEditEffectQueueModal: (queueId?: string) => void;
    showDeleteEffectQueueModal: (queueId: string) => void;
    openEditQueueDurationModal: () => void;
    toggleExpanded: () => void;
    getQueueOptions: () => QueueOption[];
    getQueueActions: () => QueueAction[];
    selectedUpdated: () => void;
    options: QueueOption[];
    actions: QueueAction[];
};

(function () {
    const queuePanel: FirebotComponent<QueuePanelBindings, ControllerExtras> = {
        bindings: {
            effectsData: "<",
            onUpdate: "&"
        },
        template: `
            <div class="effect-list-queue-panel" ng-class="{'expanded': $ctrl.expanded, 'animation-complete': $ctrl.animationComplete}">
                <div class="queue-panel-header" ng-click="$ctrl.toggleExpanded()" role="button" tabindex="0">
                    <div class="queue-panel-header-left">
                        <i class="far fa-layer-group"></i>
                        <span>Queue</span>
                        <tooltip role="tooltip" aria-label="Effect queues allow you to queue up effects so they don't overlap each other. Particularly useful for events." text="'Effect queues allow you to queue up effects so they don\\'t overlap each other. Particularly useful for events!'"></tooltip>
                    </div>
                    <div class="queue-panel-header-right">
                        <div class="queue-preview" ng-if="!$ctrl.expanded">
                            <span class="queue-preview-item" uib-tooltip="Queue" append-tooltip-to-body="true">
                                <i class="far fa-stream"></i>
                                <span>{{$ctrl.getSelectedEffectQueueName()}}</span>
                            </span>
                            <span class="queue-preview-item" uib-tooltip="Priority" append-tooltip-to-body="true" ng-if="$ctrl.validQueueSelected()">
                                <i class="far fa-arrow-up"></i>
                                <span>{{$ctrl.getSelectedQueuePriority()}}</span>
                            </span>
                            <span class="queue-preview-item" uib-tooltip="Effects Duration" append-tooltip-to-body="true" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                                <i class="far fa-clock"></i>
                                <span>{{$ctrl.effectsData.queueDuration || 0}}s</span>
                            </span>
                        </div>
                        <i class="fas fa-chevron-down queue-panel-chevron"></i>
                    </div>
                </div>

                <div class="queue-panel-content">
                    <div style="padding: 14px 0;">
                        <firebot-dropdown
                            ng-model="$ctrl.effectsData.queue"
                            ng-change="$ctrl.selectedUpdated()"
                            options="$ctrl.options"
                            actions="$ctrl.actions"
                            placeholder="Select queue"
                            empty-message="No queues created"
                            dark="true"
                        />
                    </div>

                    <div class="queue-panel-control" ng-if="$ctrl.validQueueSelected()">
                        <div class="queue-control-label">
                            <i class="far fa-arrow-up"></i>
                            <span>Priority</span>
                            <tooltip role="tooltip" aria-label="If an effect list has priority, it will get added in front of other lists in the queue that do not have priority." text="'If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.'"></tooltip>
                        </div>
                        <div>
                            <toggle-button
                                toggle-model="$ctrl.effectsData.queuePriority === 'high'"
                                on-toggle="$ctrl.updateQueuePriority(newValue)"
                                font-size="32"
                            ></toggle-button>
                        </div>
                    </div>

                    <div class="queue-panel-control" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                        <div class="queue-control-label">
                            <i class="far fa-clock"></i>
                            <span>Effects Duration</span>
                            <tooltip role="tooltip" aria-label="The total duration in seconds the queue should wait after triggering this effect list before running the next one." text="'The total duration (in secs) the queue should wait after triggering this effect list before running the next one'"></tooltip>
                        </div>
                        <div class="queue-control-input">
                            <button
                                class="queue-duration-btn"
                                ng-click="$ctrl.openEditQueueDurationModal()"
                                aria-label="Effects duration: {{$ctrl.effectsData.queueDuration || 0}} seconds"
                                role="button"
                            >
                                <span class="queue-duration-value">{{$ctrl.effectsData.queueDuration || 0}}s</span>
                                <i class="far fa-edit"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        controller: function (
            effectQueuesService: EffectQueuesService,
            modalFactory: ModalFactory
        ) {
            const $ctrl = this;

            $ctrl.expanded = false;
            $ctrl.animationComplete = false;
            $ctrl.eqs = effectQueuesService;

            let animationTimeout: ReturnType<typeof setTimeout> | null = null;

            $ctrl.options = [];
            $ctrl.actions = [];

            function buildOptionsAndActions() {
                $ctrl.options = $ctrl.getQueueOptions();
                $ctrl.actions = $ctrl.getQueueActions();
            }

            $ctrl.$onInit = $ctrl.$onChanges = () => {
                buildOptionsAndActions();
            };

            $ctrl.$onDestroy = () => {
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                }
            };

            $ctrl.selectedUpdated = () => {
                buildOptionsAndActions();
                $ctrl.onUpdate();
            };

            $ctrl.toggleExpanded = () => {
                $ctrl.expanded = !$ctrl.expanded;

                // Clear any existing timeout
                if (animationTimeout) {
                    clearTimeout(animationTimeout);
                    animationTimeout = null;
                }

                if ($ctrl.expanded) {
                    // When opening, delay the overflow change until after animation (300ms)
                    $ctrl.animationComplete = false;
                    animationTimeout = setTimeout(() => {
                        $ctrl.animationComplete = true;
                        animationTimeout = null;
                    }, 300);
                } else {
                    // When closing, immediately set animationComplete to false
                    $ctrl.animationComplete = false;
                }
            };

            $ctrl.updateQueuePriority = (isHighPriority: boolean) => {
                $ctrl.effectsData.queuePriority = isHighPriority ? "high" : "none";
                $ctrl.onUpdate();
            };

            $ctrl.getSelectedEffectQueueName = () => {
                const unsetDisplay = "Not set";
                if ($ctrl.effectsData.queue == null) {
                    return unsetDisplay;
                }

                const queue = effectQueuesService.getEffectQueue($ctrl.effectsData.queue);
                if (queue == null) {
                    return unsetDisplay;
                }

                return queue.name;
            };

            $ctrl.getSelectedQueuePriority = () => {
                const priority = $ctrl.effectsData.queuePriority;
                return priority === "high" ? "Yes" : "No";
            };

            $ctrl.getSelectedQueueModeIsCustom = () => {
                if ($ctrl.effectsData.queue == null) {
                    return false;
                }

                const queue = effectQueuesService.getEffectQueue($ctrl.effectsData.queue);
                if (queue == null) {
                    return false;
                }

                return queue.mode === "custom";
            };

            $ctrl.getQueueOptions = (): QueueOption[] => {
                const queues = effectQueuesService.getEffectQueues();
                const queueOptions = queues.map((queue) => {
                    return {
                        name: queue.name,
                        value: queue.id,
                        icon: "fa-stream"
                    };
                });
                return [
                    {
                        name: "Not set",
                        value: null,
                        icon: "fa-times-circle"
                    },
                    ...queueOptions
                ];
            };

            $ctrl.getQueueActions = () => {
                const actions: QueueAction[] = [
                    {
                        label: "Create new queue",
                        icon: "fa-plus-circle",
                        type: "info",
                        onSelect: () => {
                            $ctrl.showAddEditEffectQueueModal();
                        }
                    }
                ];

                if ($ctrl.validQueueSelected()) {
                    actions.push(
                        {
                            label: `Edit "${$ctrl.getSelectedEffectQueueName()}"`,
                            icon: "fa-edit",
                            type: "info",
                            onSelect: () => {
                                $ctrl.showAddEditEffectQueueModal($ctrl.effectsData.queue);
                            }
                        },
                        {
                            label: `Delete "${$ctrl.getSelectedEffectQueueName()}"`,
                            icon: "fa-trash-alt",
                            type: "danger",
                            onSelect: () => {
                                $ctrl.showDeleteEffectQueueModal($ctrl.effectsData.queue);
                            }
                        }
                    );
                }
                return actions;
            };

            $ctrl.validQueueSelected = () => {
                if ($ctrl.effectsData.queue == null) {
                    return false;
                }

                const queue = effectQueuesService.getEffectQueue($ctrl.effectsData.queue);
                return queue != null;
            };

            $ctrl.showAddEditEffectQueueModal = (queueId?: string) => {
                void effectQueuesService.showAddEditEffectQueueModal(queueId).then((id) => {
                    $ctrl.effectsData.queue = id;
                    $ctrl.onUpdate();
                });
            };

            $ctrl.showDeleteEffectQueueModal = (queueId: string) => {
                void effectQueuesService.showDeleteEffectQueueModal(queueId).then((confirmed) => {
                    if (confirmed) {
                        $ctrl.effectsData.queue = undefined;
                        $ctrl.onUpdate();
                    }
                });
            };

            $ctrl.openEditQueueDurationModal = () => {
                modalFactory.openGetInputModal(
                    {
                        model: $ctrl.effectsData.queueDuration || 0,
                        label: "Edit Effects Duration",
                        saveText: "Save",
                        inputPlaceholder: "Enter secs",
                        validationFn: (value) => {
                            return new Promise((resolve) => {
                                if (value == null || value < 0) {
                                    return resolve(false);
                                }
                                resolve(true);
                            });
                        },
                        validationText: "Value must be greater than 0."
                    },
                    (newDuration) => {
                        $ctrl.effectsData.queueDuration = newDuration;
                        $ctrl.onUpdate();
                    }
                );
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("queuePanel", queuePanel);
})();

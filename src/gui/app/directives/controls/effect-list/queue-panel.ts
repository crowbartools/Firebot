"use strict";

import type {
    FirebotComponent,
    EffectQueuesService,
    ModalFactory,
    EffectList
} from "../../../../../types";
import type { DropdownAction, DropdownOption } from "../firebot-dropdown";
import type { PreviewItem } from "./effect-config-panel";

type Bindings = {
    effectsData: EffectList;
    onUpdate: () => void;
};

type Controller = {
    eqs: EffectQueuesService;
    getSelectedEffectQueueName: () => string;
    getSelectedQueueModeIsCustom: () => boolean;
    toggleQueueSelection: (queueId: string) => void;
    validQueueSelected: () => boolean;
    showAddEditEffectQueueModal: (queueId?: string) => void;
    showDeleteEffectQueueModal: (queueId: string) => void;
    openEditQueueDurationModal: () => void;
    getQueueOptions: () => DropdownOption[];
    getQueueActions: () => DropdownAction[];
    selectedUpdated: () => void;
    updatePreviewItems: () => void;
    options: DropdownOption[];
    actions: DropdownAction[];
    previewItems: PreviewItem[];
    mainValue: PreviewItem;
};

(function () {
    const queuePanel: FirebotComponent<Bindings, Controller> = {
        bindings: {
            effectsData: "<",
            onUpdate: "&"
        },
        template: `
            <effect-config-panel
                icon="fa-stream"
                label="Queue"
                tooltip="Effect queues allow you to queue up effects so they don't overlap each other. Particularly useful for events!"
                main-value="$ctrl.mainValue"
                preview-items="$ctrl.previewItems"
                no-bottom-margin="true"
            >
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

                <div class="config-panel-control" ng-if="$ctrl.validQueueSelected()">
                    <div class="config-control-label">
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

                <div class="config-panel-control" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                    <div class="config-control-label">
                        <i class="far fa-clock"></i>
                        <span>Effects Duration</span>
                        <tooltip role="tooltip" aria-label="The total duration in seconds the queue should wait after triggering this effect list before running the next one." text="'The total duration (in secs) the queue should wait after triggering this effect list before running the next one'"></tooltip>
                    </div>
                    <div class="config-control-input">
                        <button
                            class="config-duration-btn"
                            ng-click="$ctrl.openEditQueueDurationModal()"
                            aria-label="Effects duration: {{$ctrl.effectsData.queueDuration || 0}} seconds"
                            role="button"
                        >
                            <span class="config-duration-value">{{$ctrl.effectsData.queueDuration || 0}}s</span>
                            <i class="far fa-edit"></i>
                        </button>
                    </div>
                </div>
            </effect-config-panel>
        `,
        controller: function (
            $scope: angular.IScope,
            effectQueuesService: EffectQueuesService,
            modalFactory: ModalFactory
        ) {
            const $ctrl = this;

            $ctrl.eqs = effectQueuesService;

            $ctrl.options = [];
            $ctrl.actions = [];
            $ctrl.previewItems = [];

            function buildOptionsAndActions() {
                $ctrl.options = $ctrl.getQueueOptions();
                $ctrl.actions = $ctrl.getQueueActions();
            }

            $scope.$watchCollection(() => effectQueuesService.effectQueues, () => {
                buildOptionsAndActions();
            });

            $ctrl.$onInit = $ctrl.$onChanges = () => {
                buildOptionsAndActions();
                $ctrl.updatePreviewItems();
            };

            $ctrl.selectedUpdated = () => {
                buildOptionsAndActions();
                $ctrl.updatePreviewItems();
                $ctrl.onUpdate();
            };

            $ctrl.updatePreviewItems = () => {
                const queue = $ctrl.effectsData.queue ? effectQueuesService.getEffectQueue($ctrl.effectsData.queue) : null;
                const modeInfo = queue ? effectQueuesService.queueModes.find(mode => mode.value === queue.mode) : null;

                $ctrl.mainValue = {
                    icon: queue ? modeInfo?.iconClass ?? "fa-stream" : 'fa-ban',
                    label: $ctrl.getSelectedEffectQueueName(),
                    tooltip: (modeInfo?.description ? `${modeInfo.label} Queue: ${modeInfo.description}` : null) ?? "This effect list will run immediately when triggered."
                };

                const items: PreviewItem[] = [];

                if ($ctrl.validQueueSelected()) {
                    if ($ctrl.effectsData.queuePriority && $ctrl.effectsData.queuePriority === "high") {
                        items.push({
                            icon: "fa-arrow-up",
                            label: "Prioritized",
                            tooltip: "Has Priority"
                        });
                    }
                }

                if ($ctrl.getSelectedQueueModeIsCustom()) {
                    items.push({
                        icon: "fa-clock",
                        label: `${$ctrl.effectsData.queueDuration || 0}s`,
                        tooltip: "Effects Duration"
                    });
                }

                $ctrl.previewItems = items;
            };

            $ctrl.updateQueuePriority = (isHighPriority: boolean) => {
                $ctrl.effectsData.queuePriority = isHighPriority ? "high" : "none";
                $ctrl.updatePreviewItems();
                $ctrl.onUpdate();
            };

            $ctrl.getSelectedEffectQueueName = () => {
                const unsetDisplay = "None";
                if ($ctrl.effectsData.queue == null) {
                    return unsetDisplay;
                }

                const queue = effectQueuesService.getEffectQueue($ctrl.effectsData.queue);
                if (queue == null) {
                    return unsetDisplay;
                }

                return queue.name;
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

            $ctrl.getQueueOptions = (): DropdownOption[] => {
                const queues = effectQueuesService.getEffectQueues();
                const queueOptions: DropdownOption[] = queues.map((queue) => {
                    const modeInfo = effectQueuesService.queueModes.find(mode => mode.value === queue.mode);
                    return {
                        name: queue.name,
                        value: queue.id,
                        icon: modeInfo?.iconClass ?? "fa-stream",
                        chip: modeInfo ? modeInfo.label : undefined,
                        chipTooltip: modeInfo ? modeInfo.description : undefined
                    };
                });
                return [
                    {
                        name: "None",
                        value: null,
                        icon: "fa-ban"
                    },
                    ...queueOptions
                ];
            };

            $ctrl.getQueueActions = () => {
                const actions: DropdownAction[] = [
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
                    $ctrl.updatePreviewItems();
                    $ctrl.onUpdate();
                });
            };

            $ctrl.showDeleteEffectQueueModal = (queueId: string) => {
                void effectQueuesService.showDeleteEffectQueueModal(queueId).then((confirmed) => {
                    if (confirmed) {
                        $ctrl.effectsData.queue = undefined;
                        $ctrl.updatePreviewItems();
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
                        $ctrl.updatePreviewItems();
                        $ctrl.onUpdate();
                    }
                );
            };
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("queuePanel", queuePanel);
})();

"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('firebotApp')
        .component("effectList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                effects: "<",
                update: '&',
                modalId: "@",
                header: "@",
                headerClasses: "@",
                effectContainerClasses: "@",
                hideNumbers: "<"
            },
            template: `
            <div class="effect-list">
                <div class="flex-row-center jspacebetween effect-list-header">
                    <div style="display:flex; align-items: center;">
                        <h3 class="{{$ctrl.headerClasses}}" style="display:inline;margin:0;font-weight: 100;">EFFECTS</h3>
                        <span style="font-size: 11px; margin-left: 2px;"><tooltip text="$ctrl.header" ng-if="$ctrl.header"></tooltip></span>
                    </div>

                    <div style="display:flex;align-items: center;">
                        <div style="margin-right: 17px;" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;" aria-label="Effects duration: The total duration in seconds the queue should wait after triggering this effect list before running the next one">
                                EFFECTS DURATION
                                <tooltip role="tooltip" aria-label="The total duration in seconds the queue should wait after triggering this effect list before running the next one." text="'The total duration (in secs) the queue should wait after triggering this effect list before running the next one'"></tooltip>
                            </div>
                            <div
                                style="display: flex; justify-content: flex-end; align-items: center;font-size: 12px;"
                                ng-click="$ctrl.openEditQueueDurationModal()"
                                aria-label="Effects duration: {{$ctrl.effectsData.queueDuration || 0}} seconds"
                                role="button"
                            >
                                <b>{{$ctrl.effectsData.queueDuration || 0}}</b>s<span class="muted" style="font-size: 9px; margin-left: 5px;"><i class="fal fa-edit"></i></span>
                            </div>
                        </div>

                        <div style="margin-right: 17px;" ng-if="$ctrl.validQueueSelected()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;" aria-label="Queue Priority: If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.">
                                QUEUE PRIORITY
                                <tooltip role="tooltip" aria-label="If an effect list has priority, it will get added in front of other lists in the queue that do not have priority." text="'If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.'"></tooltip>
                            </div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <a href role="button" class="ddtext" style="font-size: 12px;" aria-label="Selected: {{$ctrl.getSelectedQueuePriority() === 'Yes' ? 'high queue priority' : 'no queue priority'}}">
                                    {{$ctrl.getSelectedQueuePriority()}}<span class="fb-arrow down ddtext"></span>
                                </a>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                    <li role="none">
                                        <a href ng-click="$ctrl.effectsData.queuePriority = 'high'" style="padding-left: 10px;" role="menuitem" aria-label="High priority">Yes</a>
                                    </li>
                                    <li role="none">
                                        <a href ng-click="$ctrl.effectsData.queuePriority = 'none'" style="padding-left: 10px;" role="menuitem" aria-label="No priority">No</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div style="margin-right: 20px;display: flex;flex-direction: column;align-items: flex-end;">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;">
                                QUEUE
                                <tooltip role="tooltip" aria-label="Effect queues allow you to queue up effects so they don't overlap each other. Particularly useful for events." text="'Effect queues allow you to queue up effects so they don\\'t overlap each other. Particularly useful for events!'"></tooltip>
                            </div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <a href role="button" class="ddtext" style="font-size: 12px;">{{$ctrl.getSelectedEffectQueueName()}}<span class="fb-arrow down ddtext"></span></a>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                    <li role="none">
                                        <a
                                            href
                                            style="padding-left: 10px;"
                                            ng-click="$ctrl.effectsData.queue = null"
                                            role="menuitem"
                                        >
                                            Unset <tooltip role="tooltip" aria-label="Effects will always play immediately when triggered" text="'Effects will always play immediately when triggered.'"></tooltip>
                                            <span ng-show="$ctrl.effectsData.queue == null" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>
                                        </a>
                                    </li>

                                    <li ng-repeat="queue in $ctrl.eqs.getEffectQueues() track by queue.id" role="none">
                                        <a href style="padding-left: 10px;" ng-click="$ctrl.toggleQueueSelection(queue.id)" role="menuitem" aria-label="Queue: {{queue.name}}">
                                            <span>{{queue.name}}</span>
                                            <span ng-show="$ctrl.effectsData.queue === queue.id" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>
                                        </a>
                                    </li>

                                    <li ng-show="$ctrl.eqs.getEffectQueues().length < 1" role="none">
                                        <a style="padding-left: 10px;" class="muted" role="menuitem">No queues created.</a>
                                    </li>

                                    <li role="separator" class="divider"></li>
                                    <li role="none">
                                        <a href style="padding-left: 10px;" ng-click="$ctrl.showAddEditEffectQueueModal()" role="menuitem">Create new queue</a>
                                    </li>

                                    <li role="none" ng-show="$ctrl.validQueueSelected()">
                                        <a href style="padding-left: 10px;" ng-click="$ctrl.showAddEditEffectQueueModal($ctrl.effectsData.queue)" role="menuitem">Edit "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>

                                    <li role="none" ng-show="$ctrl.validQueueSelected()">
                                        <a href style="padding-left: 10px;" ng-click="$ctrl.showDeleteEffectQueueModal($ctrl.effectsData.queue)" role="menuitem">Delete "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="test-effects-btn clickable" uib-tooltip="Test Effects" aria-label="Test effects" ng-click="$ctrl.testEffects()" role="button">
                            <i class="far fa-play-circle"></i>
                        </div>

                        <div uib-dropdown uib-dropdown-toggle uib-tooltip="Open effects menu" tooltip-append-to-body="true">
                            <a href role="button" aria-label="Open effects menu" class="effects-actions-btn">
                                <i class="fal fa-ellipsis-v"></i>
                            </a>
                            <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                <li role="none" ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}">
                                    <a
                                        href
                                        ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null; $ctrl.copyEffects()"
                                        role="menuitem"
                                        aria-disabled="{{!$ctrl.effectsData.list.length > 0}}"
                                    >
                                        <i class="far fa-copy" style="margin-right: 10px;"></i> Copy all effects
                                    </a>
                                </li>
                                <li role="none" ng-class="{'disabled': !$ctrl.hasCopiedEffects()}">
                                    <a
                                        href
                                        ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null; $ctrl.pasteEffects(true)"
                                        role="menuitem"
                                        aria-disabled="{{!$ctrl.hasCopiedEffects()}}"
                                    >
                                        <i class="far fa-paste" style="margin-right: 10px;"></i> Paste effects
                                    </a>
                                </li>
                                <li role="none" ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}">
                                    <a
                                        href
                                        ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null; $ctrl.removeAllEffects()"
                                        role="menuitem"
                                        aria-disabled="{{!$ctrl.effectsData.list.length > 0}}"
                                        style="color: #fb7373;"
                                    >
                                        <i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete all effects
                                    </a>
                                </li>
                                <li class="divider" role="separator"></li>
                                <li role="none" ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}">
                                    <a
                                        href
                                        ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null; $ctrl.shareEffects();"
                                        role="menuitem"
                                        aria-disabled="{{!$ctrl.effectsData.list.length > 0}}"
                                    >
                                        <i class="far fa-share-alt" style="margin-right: 10px;"></i> Share effects
                                    </a>
                                </li>
                                <li role="none">
                                    <a href ng-click="$ctrl.importSharedEffects();" role="menuitem">
                                        <i class="far fa-cloud-download-alt" style="margin-right: 5px;"></i> Import shared effect
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="{{$ctrl.effectContainerClasses}}" style="margin-left: 15px;margin-right: 15px;padding-bottom: 15px;">
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsData.list">
                        <div ng-repeat="effect in $ctrl.effectsData.list track by $index" context-menu="$ctrl.effectMenuOptions">
                            <div
                                role="button"
                                class="effect-bar clickable-dark"
                                ng-class="{'disabled': !effect.active}"
                                ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"
                                ng-mouseenter="hovering = true"
                                ng-mouseleave="hovering = false">
                                    <span style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;padding-right: 10px;">
                                        <span class="muted" ng-hide="$ctrl.hideNumbers === true">{{$index + 1}}. </span>
                                        {{$ctrl.getEffectNameById(effect.type)}}
                                        <span ng-if="effect.effectLabel" class="muted"> ({{effect.effectLabel}})</span>
                                    </span>
                                    <span class="flex-row-center">
                                        <span class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex" ng-class="{'hiddenHandle': !hovering}" ng-click="$event.stopPropagation()">
                                            <i class="fal fa-bars"></i>
                                        </span>
                                        <div
                                            uib-dropdown
                                            style="font-size: 20px;height: 38px;width: 35px;text-align: center;display: flex;align-items: center;justify-content: center;"
                                            ng-click="$event.stopPropagation()"
                                            uib-dropdown-toggle
                                        >
                                            <a
                                                href
                                                class="effects-actions-btn"
                                                aria-label="Open effect menu"
                                                uib-tooltip="Open effect menu"
                                                tooltip-append-to-body="true"
                                                role="button"
                                            >
                                                <i class="fal fa-ellipsis-v"></i>
                                            </a>
                                            <ul class="dropdown-menu" uib-dropdown-menu style="transform: translateY(-205px);" role="menu">
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.editLabelForEffectAtIndex($index)">
                                                        <i class="fal fa-tag" style="margin-right: 10px;"></i>  {{$ctrl.getLabelButtonTextForLabel(effect.effectLabel)}}
                                                    </a>
                                                </li>
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)">
                                                        <i class="fal fa-edit" style="margin-right: 10px;"></i>  Edit
                                                    </a>
                                                </li>
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.toggleEffectActiveState($index)">
                                                        <i class="fal fa-toggle-off" style="margin-right: 10px;"></i>  Toggle Enabled
                                                    </a>
                                                </li>
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.duplicateEffectAtIndex($index)">
                                                        <i class="fal fa-clone" style="margin-right: 10px;"></i>  Duplicate
                                                    </a>
                                                </li>
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.copyEffectAtIndex($index)">
                                                        <i class="fal fa-copy" style="margin-right: 10px;"></i>  Copy
                                                    </a>
                                                </li>
                                                <li role="none" ng-class="{'disabled': !$ctrl.hasCopiedEffects()}">
                                                    <a
                                                        href
                                                        role="menuitem"
                                                        ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null; $ctrl.pasteEffectsAtIndex($index, true)"
                                                        aria-disabled={{!$ctrl.hasCopiedEffects()}}
                                                    >
                                                        <i class="fal fa-paste" style="margin-right: 10px;"></i>  Paste Before
                                                    </a>
                                                </li>
                                                <li role="none" ng-class="{'disabled': !$ctrl.hasCopiedEffects()}">
                                                    <a
                                                        href
                                                        role="menuitem"
                                                        ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null; $ctrl.pasteEffectsAtIndex($index, false)"
                                                        aria-disabled={{!$ctrl.hasCopiedEffects()}}
                                                    >
                                                        <i class="fal fa-paste" style="margin-right: 10px;"></i>  Paste After
                                                    </a>
                                                </li>
                                                <li role="none">
                                                    <a href role="menuitem" ng-click="$ctrl.removeEffectAtIndex($index)" style="color: #fb7373;">
                                                        <i class="far fa-trash-alt" style="margin-right: 10px;"></i>  Delete
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </span>
                            </div>
                        </div>
                    </div>

                    <div class="add-more-functionality" style="margin-top: 16px;margin-left: 12px;">
                        <a href role="button" class="clickable" ng-click="$ctrl.openNewEffectModal()" aria-label="Add new effect">
                            <i class="far fa-plus-circle"></i>Add New Effect
                        </a>
                    </div>
                </div>

            </div>
            `,
            controller: function(utilityService, effectHelperService, objectCopyHelper, effectQueuesService,
                backendCommunicator, ngToast, $http) {
                let ctrl = this;

                ctrl.effectsData = {
                    list: []
                };

                let effectDefinitions = [];

                function createEffectsData() {
                    if (ctrl.effects != null && !Array.isArray(ctrl.effects)) {
                        ctrl.effectsData = ctrl.effects;
                    }
                    if (ctrl.effectsData.list == null) {
                        ctrl.effectsData.list = [];
                    }
                    if (ctrl.effectsData.id == null) {
                        ctrl.effectsData.id = uuidv1();
                    }

                    ctrl.effectsData.list.forEach(e => {
                        if (e.active == null) {
                            e.active = true;
                        }
                    });

                    ctrl.effectsUpdate();
                }

                ctrl.shareEffects = async () => {
                    let shareCode = await backendCommunicator.fireEventAsync("getEffectsShareCode", ctrl.effectsData.list);
                    if (shareCode == null) {
                        ngToast.create("Unable to share effects.");
                    } else {
                        utilityService.showModal({
                            component: "copyShareCodeModal",
                            size: 'sm',
                            resolveObj: {
                                shareCode: () => shareCode,
                                title: () => "Effects Share Code",
                                message: () => "Share the below code so others can import these effects."
                            }
                        });
                    }
                };

                function getSharedEffects(code) {
                    return $http.get(`https://bytebin.lucko.me/${code}`)
                        .then(resp => {
                            if (resp.status === 200) {
                                return JSON.parse(unescape(JSON.stringify(resp.data)));
                            }
                            return null;
                        }, () => {
                            return null;
                        });
                }

                ctrl.importSharedEffects = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Enter Effects Share Code",
                            saveText: "Add",
                            inputPlaceholder: "Enter code",
                            validationFn: (shareCode) => {
                                return new Promise(async resolve => {
                                    if (shareCode == null || shareCode.trim().length < 1) {
                                        resolve(false);
                                    }

                                    let effectsData = await getSharedEffects(shareCode);

                                    if (effectsData == null || effectsData.effects == null) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Not a valid effects share code."

                        },
                        async (shareCode) => {
                            let effectsData = await getSharedEffects(shareCode);
                            if (effectsData.effects != null) {
                                ctrl.effectsData.list = ctrl.effectsData.list.concat(effectsData.effects);
                            }
                        });
                };

                // when the element is initialized
                ctrl.$onInit = async function() {
                    createEffectsData();
                    effectDefinitions = await effectHelperService.getAllEffectDefinitions();
                };

                ctrl.getEffectNameById = id => {
                    if (!effectDefinitions || effectDefinitions.length < 1) {
                        return "";
                    }

                    return effectDefinitions.find(e => e.id === id).name;
                };

                ctrl.$onChanges = function() {
                    createEffectsData();
                };

                ctrl.effectsUpdate = function() {
                    ctrl.update({ effects: ctrl.effectsData });
                };

                ctrl.effectTypeChanged = function(effectType, index) {
                    ctrl.effectsData.list[index].type = effectType.id;
                };
                ctrl.testEffects = function() {
                    ipcRenderer.send('runEffectsManually', ctrl.effectsData);
                };

                ctrl.getLabelButtonTextForLabel = function(labelModel) {
                    if (labelModel == null || labelModel.length === 0) {
                        return "Add Label";
                    }
                    return "Edit Label";
                };

                ctrl.editLabelForEffectAtIndex = function(index) {
                    let effect = ctrl.effectsData.list[index];
                    let label = effect.effectLabel;
                    utilityService.openGetInputModal(
                        {
                            model: label,
                            label: ctrl.getLabelButtonTextForLabel(label),
                            saveText: "Save Label"
                        },
                        (newLabel) => {
                            if (newLabel == null || newLabel.length === 0) {
                                effect.effectLabel = null;
                            } else {
                                effect.effectLabel = newLabel;
                            }
                        });
                };

                ctrl.toggleEffectActiveState = (index) => {
                    const effect = ctrl.effectsData.list[index];
                    effect.active = !effect.active;
                };

                ctrl.duplicateEffectAtIndex = function(index) {
                    let effect = JSON.parse(angular.toJson(ctrl.effectsData.list[index]));
                    effect.id = uuidv1();
                    ctrl.effectsData.list.splice(index + 1, 0, effect);
                    ctrl.effectsUpdate();
                };

                ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.removeEffectAtIndex = function(index) {
                    ctrl.effectsData.list.splice(index, 1);
                    ctrl.effectsUpdate();
                };

                ctrl.removeAllEffects = function() {
                    ctrl.effectsData.list = [];
                    ctrl.effectsUpdate();
                };

                ctrl.hasCopiedEffects = function() {
                    return objectCopyHelper.hasCopiedEffects();
                };

                ctrl.pasteEffects = async function(append = false) {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (append) {
                            ctrl.effectsData.list = ctrl.effectsData.list.concat(
                                await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta)
                            );
                        } else {
                            ctrl.effectsData.list = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        }
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.pasteEffectsAtIndex = async (index, above) => {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (!above) {
                            index++;
                        }
                        const copiedEffects = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        ctrl.effectsData.list.splice(index, 0, ...copiedEffects);
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.copyEffectAtIndex = function(index) {
                    objectCopyHelper.copyEffects([ctrl.effectsData.list[index]]);
                };

                ctrl.copyEffects = function() {
                    objectCopyHelper.copyEffects(ctrl.effectsData.list);
                };

                ctrl.openNewEffectModal = function() {
                    utilityService.showModal({
                        component: "addNewEffectModal",
                        backdrop: true,
                        windowClass: "no-padding-modal",
                        resolveObj: {
                            trigger: () => ctrl.trigger,
                            triggerMeta: () => ctrl.triggerMeta
                        },
                        closeCallback: resp => {
                            if (resp == null) {
                                return;
                            }

                            let { selectedEffectDef } = resp;

                            let newEffect = {
                                id: uuidv1(),
                                type: selectedEffectDef.id,
                                active: true
                            };

                            ctrl.openEditEffectModal(newEffect, null, ctrl.trigger);
                        }
                    });
                };

                ctrl.openEditEffectModal = function(effect, index, trigger) {
                    utilityService.showEditEffectModal(effect, index, trigger, response => {
                        if (response.action === "add") {
                            ctrl.effectsData.list.push(response.effect);
                        } else if (response.action === "update") {
                            ctrl.effectsData.list[response.index] = response.effect;
                        } else if (response.action === "delete") {
                            ctrl.removeEffectAtIndex(response.index);
                        }
                        ctrl.effectsUpdate();
                    }, ctrl.triggerMeta);
                };

                ctrl.effectMenuOptions = [
                    {
                        html: `<a href ><i class="far fa-tag" style="margin-right: 10px;"></i> Edit Label</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.editLabelForEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-edit" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            const effect = $itemScope.effect;
                            ctrl.openEditEffectModal(effect, $index, ctrl.trigger);
                        }
                    },
                    {
                        html: `<a href ><i class="fal fa-toggle-off" style="margin-right: 10px;"></i>  Toggle Enabled</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.toggleEffectActiveState($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.duplicateEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-copy" style="margin-right: 10px;"></i> Copy</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.copyEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-paste" style="margin-right: 10px;"></i> Paste Before</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            if (ctrl.hasCopiedEffects()) {
                                ctrl.pasteEffectsAtIndex($index, true);
                            }
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-paste" style="margin-right: 10px;"></i> Paste After</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            if (ctrl.hasCopiedEffects()) {
                                ctrl.pasteEffectsAtIndex($index, false);
                            }
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.removeEffectAtIndex($index);
                        }
                    }
                ];

                //effect queue

                ctrl.eqs = effectQueuesService;

                ctrl.getSelectedEffectQueueName = () => {
                    const unsetDisplay = "Not set";
                    if (ctrl.effectsData.queue == null) {
                        return unsetDisplay;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) {
                        return unsetDisplay;
                    }

                    return queue.name;
                };

                ctrl.getSelectedQueuePriority = () => {
                    const priority = ctrl.effectsData.queuePriority;
                    return priority === 'high' ? 'Yes' : 'No';
                };

                ctrl.getSelectedQueueModeIsCustom = () => {
                    if (ctrl.effectsData.queue == null) {
                        return false;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) {
                        return false;
                    }

                    return queue.mode === "custom";
                };

                ctrl.toggleQueueSelection = (queueId) => {
                    if (ctrl.effectsData.queue !== queueId) {
                        ctrl.effectsData.queue = queueId;
                    } else {
                        ctrl.effectsData.queue = null;
                    }
                };

                ctrl.validQueueSelected = () => {
                    if (ctrl.effectsData.queue == null) {
                        return false;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    return queue != null;
                };

                ctrl.showAddEditEffectQueueModal = (queueId) => {
                    effectQueuesService.showAddEditEffectQueueModal(queueId)
                        .then(id => {
                            ctrl.effectsData.queue = id;
                        });
                };

                ctrl.showDeleteEffectQueueModal = (queueId) => {
                    effectQueuesService.showDeleteEffectQueueModal(queueId)
                        .then(confirmed => {
                            if (confirmed) {
                                ctrl.effectsData.queue = undefined;
                            }
                        });
                };

                ctrl.openEditQueueDurationModal = () => {
                    utilityService.openGetInputModal(
                        {
                            model: ctrl.effectsData.queueDuration || 0,
                            label: "Edit Effects Duration",
                            saveText: "Save",
                            inputPlaceholder: "Enter secs",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value < 0) {
                                        return resolve(false);
                                    }
                                    resolve(true);
                                });
                            },
                            validationText: "Value must be greater than 0."

                        },
                        (newDuration) => {
                            ctrl.effectsData.queueDuration = newDuration;
                        }
                    );
                };

            }
        });
}());

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

                        <div style="margin-right: 20px;display: flex;flex-direction: column;align-items: flex-end;">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;">QUEUE<tooltip text="'Effect queues allow you to queue up effects so they don\\'t overlap each other. Particularly useful for events!'"></tooltip></div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <div class="noselect pointer ddtext" style="font-size: 12px;">{{$ctrl.getSelectedEffectQueueName()}}<span class="fb-arrow down ddtext"></span></div>
                                <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>

                                    <li ng-click="$ctrl.effectsData.queue = null">
                                        <a style="padding-left: 10px;">Unset <tooltip text="'Effects will always play immediately when triggered.'"></tooltip>
                                        <span ng-show="$ctrl.effectsData.queue == null" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>
                                        </a>   
                                    </li>

                                    <li ng-repeat="queue in $ctrl.eqs.getEffectQueues() track by queue.id" ng-click="$ctrl.toggleQueueSelection(queue.id)">
                                        <a style="padding-left: 10px;">
                                            <span>{{queue.name}}</span>
                                            <span ng-show="$ctrl.effectsData.queue === queue.id" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>      
                                        </a>
                                    </li>

                                    <li ng-show="$ctrl.eqs.getEffectQueues().length < 1">
                                        <a style="padding-left: 10px;" class="muted">No queues created.</a>
                                    </li>

                                    <li role="separator" class="divider"></li>
                                    <li ng-click="$ctrl.showAddEditEffectQueueModal()">
                                        <a style="padding-left: 10px;">Create new queue</a>
                                    </li>

                                    <li ng-show="$ctrl.validQueueSelected()" ng-click="$ctrl.showAddEditEffectQueueModal($ctrl.effectsData.queue)">
                                        <a style="padding-left: 10px;">Edit "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>

                                    <li ng-show="$ctrl.validQueueSelected()" ng-click="$ctrl.showDeleteEffectQueueModal($ctrl.effectsData.queue)">
                                        <a style="padding-left: 10px;">Delete "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="test-effects-btn clickable" uib-tooltip="Test Effects">
                            <i class="far fa-play-circle" style="cursor: pointer;" ng-click="$ctrl.testEffects()"></i>
                        </div>
                        
                        <div uib-dropdown uib-dropdown-toggle>
                            <span class="noselect pointer effects-actions-btn"><i class="fal fa-ellipsis-v"></i></span>
                            <ul class="dropdown-menu" uib-dropdown-menu>
                                <li ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}" ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null">
                                    <a href ng-click="$ctrl.copyEffects()"><i class="far fa-copy" style="margin-right: 10px;"></i> Copy all effects</a>
                                </li>
                                <li ng-class="{'disabled': !$ctrl.hasCopiedEffects()}" ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null">
                                    <a href ng-click="$ctrl.pasteEffects(true)"><i class="far fa-paste" style="margin-right: 10px;"></i> Paste effects</a>
                                </li>
                                <li ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}" ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null">
                                    <a href ng-click="$ctrl.removeAllEffects()" style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete all effects</a>
                                </li>
                                <li class="divider"></li>
                                <li ng-class="{'disabled': !$ctrl.effectsData.list.length > 0}" ng-click="!$ctrl.effectsData.list > 0 ? $event.stopPropagation() : null">
                                    <a href ng-click="$ctrl.shareEffects();"><i class="far fa-share-alt" style="margin-right: 10px;"></i> Share effects</a>
                                </li>
                                <li>
                                    <a href ng-click="$ctrl.importSharedEffects();"><i class="far fa-cloud-download-alt" style="margin-right: 5px;"></i> Import shared effects</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="{{$ctrl.effectContainerClasses}}" style="margin-left: 15px;margin-right: 15px;padding-bottom: 15px;">
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsData.list">
                        <div ng-repeat="effect in $ctrl.effectsData.list track by $index">
                            <div class="effect-bar clickable-dark"
                                ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"
                                ng-mouseenter="hovering = true"
                                ng-mouseleave="hovering = false">
                                    <span style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;padding-right: 10px;">
                                        <span class="muted" ng-hide="$ctrl.hideNumbers === true">{{$index + 1}}. </span>
                                        {{$ctrl.getEffectNameById(effect.type)}}
                                        <span ng-if="effect.effectLabel" class="muted"> ({{effect.effectLabel}})</span>
                                    </span>
                                    <span class="flex-row-center ">
                                        <span class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex" ng-class="{'hiddenHandle': !hovering}" ng-click="$event.stopPropagation()">
                                            <i class="fal fa-bars" aria-hidden="true"></i>
                                        </span> 
                                        <div class="clickable" style="font-size: 20px;height: 38px;width: 35px;text-align: center;display: flex;align-items: center;justify-content: center;" uib-dropdown uib-dropdown-toggle dropdown-append-to-body="true" ng-click="$event.stopPropagation()">
                                            <span class="noselect pointer"> <i class="fal fa-ellipsis-v"></i> </span>
                                            <ul class="dropdown-menu" uib-dropdown-menu>
                                                <li><a href ng-click="$ctrl.editLabelForEffectAtIndex($index)"><i class="fal fa-tag" style="margin-right: 10px;" aria-hidden="true"></i>  {{$ctrl.getLabelButtonTextForLabel(effect.effectLabel)}}</a></li>
                                                <li><a href ng-click="$ctrl.duplicateEffectAtIndex($index)"><i class="fal fa-clone" style="margin-right: 10px;" aria-hidden="true"></i>  Duplicate</a></li>
                                                <li><a href ng-click="$ctrl.copyEffectAtIndex($index)"><i class="fal fa-copy" style="margin-right: 10px;" aria-hidden="true"></i>  Copy</a></li>
                                                <li ng-class="{'disabled': !$ctrl.hasCopiedEffects()}" ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null"><a href ng-click="$ctrl.pasteEffectsAtIndex($index, false)"><i class="fal fa-paste" style="margin-right: 10px;" aria-hidden="true"></i>  Paste After</a></li>
                                                <li><a href ng-click="$ctrl.removeEffectAtIndex($index)" style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i>  Delete</a></li>
                                            </ul>
                                        </div>
                                    </span> 
                            </div>
                        </div>
                    </div>
            
                    <div class="add-more-functionality" style="margin-top: 16px;margin-left: 12px;">
                        <a class="clickable" ng-click="$ctrl.addEffect()"> <i class="far fa-plus-circle"></i> New Effect</a>
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
                                return resp.data;
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
                    if (!effectDefinitions || effectDefinitions.length < 1) return "";
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

                ctrl.pasteEffectsAtIndex = async function(index, above) {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (!above) {
                            index++;
                        }
                        let copiedEffects = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
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

                ctrl.addEffect = function() {
                    let newEffect = {
                        id: uuidv1(),
                        type: "Nothing"
                    };

                    ctrl.openEditEffectModal(newEffect, null, ctrl.trigger);
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

                //effect queue

                ctrl.eqs = effectQueuesService;

                ctrl.getSelectedEffectQueueName = () => {
                    const unsetDisplay = "Not set";
                    if (ctrl.effectsData.queue == null) return unsetDisplay;
                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) return unsetDisplay;
                    return queue.name;
                };

                ctrl.toggleQueueSelection = (queueId) => {
                    if (ctrl.effectsData.queue !== queueId) {
                        ctrl.effectsData.queue = queueId;
                    } else {
                        ctrl.effectsData.queue = null;
                    }
                };

                ctrl.validQueueSelected = () => {
                    if (ctrl.effectsData.queue == null) return false;
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

            }
        });
}());

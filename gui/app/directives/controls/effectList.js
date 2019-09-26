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
                                    <a href ng-click="$ctrl.removeAllEffects()" style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete all effects</a>
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
                                                <li><a href ng-click="$ctrl.removeEffectAtIndex($index)" style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i>  Delete</a></li>
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
            controller: function(utilityService, effectHelperService, objectCopyHelper) {
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
                        ctrl.effectsUpdate();
                    }
                    if (ctrl.effectsData.id == null) {
                        ctrl.effectsData.id = uuidv1();
                        ctrl.effectsUpdate();
                    }
                }

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
            }
        });
}());

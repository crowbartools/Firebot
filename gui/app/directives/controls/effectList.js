'use strict';
(function() {


    angular
        .module('firebotApp')
        .component("effectList", {
            bindings: {
                trigger: "@",
                effects: "<",
                isArray: "<",
                update: '&',
                modalId: "@",
                header: "@",
                headerClasses: "@",
                effectContainerClasses: "@"
            },
            template: `
            <div>
                <div class="flex-row-center jspacebetween" style="margin-bottom:10px;">
                    <h3 class="{{$ctrl.headerClasses}}" style="display:inline;margin:0;">{{$ctrl.header}}</h3>
                    
                    <div uib-dropdown uib-dropdown-toggle>
                        <span class="noselect pointer effects-actions-btn"><i class="fal fa-ellipsis-h"></i></span>
                        <ul class="dropdown-menu" uib-dropdown-menu>
                            <li ng-class="{'disabled': !$ctrl.effectsArray.length > 0}" ng-click="!$ctrl.effectsArray > 0 ? $event.stopPropagation() : null">
                                <a href ng-click="$ctrl.copyEffects()"><i class="far fa-copy" style="margin-right: 10px;"></i> Copy all effects</a>
                            </li>
                            <li ng-class="{'disabled': !$ctrl.hasCopiedEffects()}" ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null">
                                <a href ng-click="$ctrl.pasteEffects(true)"><i class="far fa-paste" style="margin-right: 10px;"></i> Paste effects</a>
                            </li>
                            <li ng-class="{'disabled': !$ctrl.effectsArray.length > 0}" ng-click="!$ctrl.effectsArray > 0 ? $event.stopPropagation() : null">
                                <a href ng-click="$ctrl.removeAllEffects()" style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete all effects</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="{{$ctrl.effectContainerClasses}}">
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsArray">
                        <div ng-repeat="effect in $ctrl.effectsArray track by $index">
                            <div class="effect-bar clickable-dark"
                                ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"
                                ng-mouseenter="hovering = true"
                                ng-mouseleave="hovering = false">
                                    <span style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;padding-right: 10px;">
                                        <span class="muted">{{$index + 1}}. </span>
                                        {{effect.type}}
                                        <span ng-if="effect.effectLabel" class="muted"> ({{effect.effectLabel}})</span>
                                    </span>
                                    <span class="flex-row-center ">
                                        <i class="dragHandle fal fa-bars" ng-class="{'hiddenHandle': !hovering}" aria-hidden="true" style="margin-right:15px" ng-click="$event.stopPropagation()"></i>
                                        <div class="clickable" style="margin-right:15px; font-size: 20px; width: 15px; text-align: center;" uib-dropdown uib-dropdown-toggle dropdown-append-to-body="true" ng-click="$event.stopPropagation()">
                                            <span class="noselect pointer"> <i class="fal fa-ellipsis-v"></i> </span>
                                            <ul class="dropdown-menu" uib-dropdown-menu>
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
            
                    <div class="add-more-functionality">
                        <button type="button" class="btn btn-link" ng-click="$ctrl.addEffect()">
                            + Add Effect
                        </button>
                    </div>
                </div>
                
            </div>
            `,
            controller: function(utilityService) {
                let ctrl = this;

                ctrl.effectsArray = [];
                function createEffectsArray() {
                    if (ctrl.effects == null) {
                        if (ctrl.isArray) {
                            ctrl.effects = [];
                        } else {
                            ctrl.effects = {};
                        }
                    }

                    if (ctrl.isArray) {
                        ctrl.effectsArray = ctrl.effects;
                    } else {
                        ctrl.effectsArray = Object.keys(ctrl.effects).map(k => ctrl.effects[k]);
                    }
                }

                function getEffectsObject() {
                    let obj;
                    if (ctrl.isArray) {
                        obj = ctrl.effectsArray;
                    } else {
                        let effects = {};
                        let count = 1;
                        ctrl.effectsArray.forEach(e => {
                            effects[count.toString()] = e;
                            count++;
                        });
                        obj = effects;
                    }
                    return obj;
                }

                // when the element is initialized
                ctrl.$onInit = function() {
                    createEffectsArray();
                };

                ctrl.$onChanges = function () {
                    createEffectsArray();
                };

                ctrl.effectsUpdate = function() {
                    ctrl.update({effects: getEffectsObject()});
                };

                ctrl.effectTypeChanged = function(effectType, index) {
                    ctrl.effectsArray[index].type = effectType.name;
                };

                ctrl.sortableOptions = {
                    handle: '.dragHandle',
                    stop: () => {
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.duplicateEffectAtIndex = function(index) {
                    let effect = JSON.parse(angular.toJson(ctrl.effectsArray[index]));
                    ctrl.effectsArray.splice(index + 1, 0, effect);
                    ctrl.effectsUpdate();
                };

                ctrl.removeEffectAtIndex = function(index) {
                    ctrl.effectsArray.splice(index, 1);
                    ctrl.effectsUpdate();
                };

                ctrl.removeAllEffects = function() {
                    ctrl.effectsArray = [];
                    ctrl.effectsUpdate();
                };

                ctrl.hasCopiedEffects = function() {
                    return utilityService.hasCopiedEffects(ctrl.trigger);
                };

                ctrl.hasMultipleCopiedEffects = function() {
                    return utilityService.hasCopiedEffects(ctrl.trigger) &&
                    utilityService.getCopiedEffects(ctrl.trigger).length > 1;
                };

                ctrl.pasteEffects = function(append = false) {
                    if (utilityService.hasCopiedEffects(ctrl.trigger)) {
                        if (append) {
                            ctrl.effectsArray = ctrl.effectsArray.concat(utilityService.getCopiedEffects(ctrl.trigger));
                        } else {
                            ctrl.effectsArray = utilityService.getCopiedEffects(ctrl.trigger);
                        }
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.pasteEffectsAtIndex = function(index, above) {
                    if (utilityService.hasCopiedEffects(ctrl.trigger)) {
                        if (!above) {
                            index++;
                        }
                        let copiedEffects = utilityService.getCopiedEffects(ctrl.trigger);
                        ctrl.effectsArray.splice(index, 0, ...copiedEffects);
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.copyEffectAtIndex = function(index) {
                    utilityService.copyEffects(ctrl.trigger, [ctrl.effectsArray[index]]);
                };

                ctrl.copyEffects = function() {
                    utilityService.copyEffects(ctrl.trigger, ctrl.effectsArray);
                };

                ctrl.addEffect = function() {

                    let newEffect = { type: "Nothing" };

                    ctrl.openEditEffectModal(newEffect, null, ctrl.trigger);
                };

                ctrl.openEditEffectModal = function(effect, index, trigger) {
                    utilityService.showEditEffectModal(effect, index, trigger, (response) => {
                        if (response.action === 'add') {
                            ctrl.effectsArray.push(response.effect);
                        } else if (response.action === 'update') {
                            ctrl.effectsArray[response.index] = response.effect;
                        } else if (response.action === 'delete') {
                            ctrl.removeEffectAtIndex(response.index);
                        }
                        ctrl.effectsUpdate();
                    });
                };
            }
        });
}());

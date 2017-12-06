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
                modalId: "@"
            },
            template: `
            <div>
                <!--<uib-accordion close-others="true" template-url="effect-accordian.html">
                    <div uib-accordion-group
                        ng-repeat="effect in $ctrl.effectsArray"
                        class="panel-primary effect-panel"
                        template-url="effect-header-template.html"
                        ng-click="$ctrl.openEditEffectModal(effect, $ctrl.trigger)"
                        ng-mouseenter="hovering = true"
                        ng-mouseleave="hovering = false">

                        <uib-accordion-heading>
                            <div class="effect-panel" style="display:flex;">
                                <span>{{effect.type}}</span>
                                <span>
                                    <i class="dragHandle fal fa-bars" ng-class="{'hiddenHandle': !hovering || $ctrl.anEffectPanelIsOpen}" aria-hidden="true" style="margin-right:15px"></i>
                                    <i class="fal" ng-class="{'fa-angle-right': !$ctrl.openEffectPanel[$index], 'fa-angle-down': $ctrl.openEffectPanel[$index]}" style="width:10px"></i>
                                </span> 
                            </div>
                        </uib-accordion-heading>

                        <div class="effect-select-wrapper">
                            <searchable-effect-dropdown trigger="{{$ctrl.trigger}}" selected="effect.type" style="width:100%" update="$ctrl.effectTypeChanged(effectType, $index)"></searchable-effect-dropdown>
                            
                            <span class="effect-delete-btn clickable" ng-click="$ctrl.removeEffectAtIndex($index)"><i class="far fa-trash-alt"></i></span>
                        </div>
                        <div class="effect-settings-panel">
                            <div ng-show="effect.type == 'Nothing'" class="effect-specific-title"><h4>Please select an effect.</h4></div>
                            <effect-options effect="effect" type="effect.type" trigger="{{$ctrl.trigger}}" ng-show="effect.type != null"><effect-options>
                        </div>
                    </div>
                </uib-accordion>-->
                <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsArray">
                    <div ng-repeat="effect in $ctrl.effectsArray track by $index">
                        <div class="effect-bar clickable-dark"
                            ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"
                            ng-mouseenter="hovering = true"
                            ng-mouseleave="hovering = false">
                            <span>{{effect.type}}</span>
                            <span class="flex-row-center ">
                                <i class="dragHandle fal fa-bars" ng-class="{'hiddenHandle': !hovering}" aria-hidden="true" style="margin-right:15px"></i>
                                <div class="clickable" style="margin-right:15px; font-size: 20px; width: 15px; text-align: center;" uib-dropdown uib-dropdown-toggle dropdown-append-to-body="true" ng-click="$event.stopPropagation()">
                                    <span class="noselect pointer"> <i class="fal fa-ellipsis-v"></i> </span>
                                    <ul class="dropdown-menu" uib-dropdown-menu>
                                        <li><a href ng-click="$ctrl.duplicateEffectAtIndex($index)"><i class="fal fa-clone" style="margin-right: 10px;" aria-hidden="true"></i>  Duplicate</a></li>
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

                <script type="text/ng-template" id="effect-accordian.html">
                    <div role="tablist" class="panel-group" ng-transclude ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsArray"></div>
                </script>

                <script type="text/ng-template" id="effect-header-template.html">
                    <div class="panel-heading clickable-dark" ng-click="toggleOpen()" uib-accordion-transclude="heading">
                        <div uib-accordion-header></div>
                    </div>
                    <div class="panel-collapse collapse" uib-collapse="!isOpen">
                    <div class="panel-body" ng-transclude></div>
                    </div>
                </script>
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
                ctrl.checkForOpenEffects = function() {
                    ctrl.anEffectPanelIsOpen = Object.keys(ctrl.openEffectPanel)
                        .some(i => ctrl.openEffectPanel[i]);
                };

                ctrl.addEffect = function() {

                    ctrl.effectsArray.push({
                        type: "Nothing"
                    });

                    ctrl.effectsUpdate();
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

                ctrl.openEditEffectModal = function(effect, index, trigger) {
                    utilityService.showEditEffectModal(effect, index, trigger, (response) => {
                        if (response.action === 'update') {
                            ctrl.effectsArray[response.index] = response.effect;
                            ctrl.effectsUpdate();
                        } else if (response.action === 'delete') {
                            ctrl.removeEffectAtIndex(response.index);
                            ctrl.effectsUpdate();
                        }
                    });
                };
            }
        });
}());

'use strict';
(function() {


    angular
        .module('firebotApp')
        .component("effectList", {
            bindings: {
                trigger: "@",
                effects: "<",
                isArray: "<",
                update: '&'
            },
            template: `
            <div>
                <uib-accordion close-others="true" template-url="effect-accordian.html">
                    <div uib-accordion-group
                        ng-repeat="effect in $ctrl.effectsArray"
                        class="panel-primary effect-panel"
                        is-open="$ctrl.openEffectPanel[$index]"
                        template-url="effect-header-template.html"
                        ng-click="$ctrl.checkForOpenEffects()"
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
                </uib-accordion>
        
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
            controller: function() {
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

                // We also call this when a new effect is added or an old effect is deleted
                // to open the last effect again.
                ctrl.openEffectPanel = {};
                function clearOutOpenPanelCache() {
                    Object.keys(ctrl.openEffectPanel).forEach(k => {
                        ctrl.openEffectPanel[k] = false;
                    });
                    ctrl.anEffectPanelIsOpen = false;
                }

                function updateOpenPanel() {
                    // We get the index of the last effect and add true to a scope varible
                    // that the accordian directive is looking at

                    clearOutOpenPanelCache();

                    let lastEffectIndex = ctrl.effectsArray.length - 1;
                    ctrl.openEffectPanel[lastEffectIndex] = true;
                    ctrl.checkForOpenEffects();
                }

                ctrl.anEffectPanelIsOpen = false;
                ctrl.checkForOpenEffects = function() {
                    ctrl.anEffectPanelIsOpen = Object.keys(ctrl.openEffectPanel)
                        .some(i => ctrl.openEffectPanel[i]);
                };

                ctrl.addEffect = function() {

                    ctrl.effectsArray.push({
                        type: "Nothing"
                    });

                    updateOpenPanel();
                    ctrl.effectsUpdate();
                };

                ctrl.removeEffectAtIndex = function(index) {
                    ctrl.effectsArray.splice(index, 1);
                    clearOutOpenPanelCache();
                    ctrl.effectsUpdate();
                };
            }
        });
}());

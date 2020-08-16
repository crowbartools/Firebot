"use strict";

const effectRunner = require("../../common/effect-runner");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const presetEffectListManager = require("../preset-lists/preset-effect-list-manager");

const effectGroup = {
    definition: {
        id: "firebot:run-effect-list",
        name: "Run Effect List",
        description:
            "Run a preset or custom list of effects",
        icon: "fad fa-list",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <eos-container header="List Type">
            <dropdown-select options="{ custom: 'Custom', preset: 'Preset'}" selected="effect.listType"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.listType === 'preset'" header="Preset Effect List" pad-top="true">
            <ui-select ng-model="effect.presetListId" theme="bootstrap"  on-select="presetListSelected($item)">
                <ui-select-match placeholder="Select or search for a preset effect list... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="presetList.id as presetList in presetEffectLists | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="presetList.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>

            <div style="margin-top: 15px">
                <button class="btn btn-default" 
                    ng-show="effect.presetListId != null" 
                    ng-click="editSelectedPresetList()">Edit '{{getSelectedPresetListName()}}'</button>
            </div>
        </eos-container>

        <eos-container ng-show="effect.listType === 'preset' && selectedPresetList != null" header="Preset List Args" pad-top="true">
            <p>Pass data to the preset select list.</p>

            <div ng-repeat="arg in selectedPresetList.args track by $index" style="margin-bottom: 5px;">

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span><b>{{arg.name}}: </b></span>
                    <div style="width: 100%; padding: 0 10px;">
                        <input type="text" class="form-control" placeholder="Enter data" ng-model="effect.presetListArgs[arg.name]" replace-variables />
                    </div>       
                </div>
            </div>
        </eos-container>

        <eos-container ng-show="effect.listType === 'custom'" header="Custom Effect List" pad-top="true">
            <effect-list effects="effect.effectList" 
                    trigger="{{trigger}}" 
                    trigger-meta="triggerMeta"
                    update="effectListUpdated(effects)"
                    modalId="{{modalId}}"></effect-list>
        </eos-container>

    `,
    optionsController: ($scope, presetEffectListsService) => {

        $scope.selectedPresetList = null;

        $scope.presetEffectLists = presetEffectListsService.getPresetEffectLists();

        $scope.presetListSelected = (presetList) => {
            $scope.selectedPresetList = presetList;
        };

        $scope.editSelectedPresetList = () => {
            if ($scope.effect.presetListId == null) return;
            presetEffectListsService.showAddEditPresetEffectListModal($scope.effect.presetListId, true)
                .then(presetList => {
                    if (presetList) {
                        $scope.selectedPresetList = presetList;
                    }
                });
        };

        $scope.getSelectedPresetListName = () => {
            return $scope.selectedPresetList ? $scope.selectedPresetList.name : "";
        };

        $scope.effectListUpdated = function(effects) {
            $scope.effect.effectList = effects;
        };

        if ($scope.effect.listType == null) {
            $scope.effect.listType = 'custom';
        }

        if ($scope.effect.presetListArgs == null) {
            $scope.effect.presetListArgs = {};
        }

        if ($scope.effect.presetListId != null) {
            const presetList = presetEffectListsService.getPresetEffectList($scope.effect.presetListId);
            if (presetList == null) {
                // preset list no longer exists
                $scope.effect.presetListId = null;
                $scope.effect.presetListArgs = {};
            } else {
                $scope.selectedPresetList = presetList;
            }
        }

    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.listType === 'preset' && effect.presetListId == null) {
            errors.push("Please select a preset list");
        }
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {

            const { effect, trigger } = event;

            let processEffectsRequest = {};

            if (effect.listType === "preset") {
                const presetList = presetEffectListManager.getPresetEffectList(effect.presetListId);
                if (presetList == null) {
                    // preset list doesnt exist anymore
                    return resolve(true);
                }

                trigger.type = EffectTrigger.PRESET_LIST;
                trigger.metadata.presetListArgs = effect.presetListArgs;

                processEffectsRequest = {
                    trigger: trigger,
                    effects: presetList.effects
                };
            } else {
                const effectList = effect.effectList;

                if (!effectList || !effectList.list) {
                    return resolve(true);
                }

                processEffectsRequest = {
                    trigger: trigger,
                    effects: effectList
                };
            }

            effectRunner.processEffects(processEffectsRequest)
                .then(result => {
                    if (result != null && result.success === true) {
                        if (result.stopEffectExecution) {
                            return resolve({
                                success: true,
                                execution: {
                                    stop: true,
                                    bubbleStop: true
                                }
                            });
                        }
                    }
                    resolve(true);
                });

        });
    }
};

module.exports = effectGroup;

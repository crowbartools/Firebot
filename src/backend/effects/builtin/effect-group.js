"use strict";

const effectRunner = require("../../common/effect-runner");
const { EffectCategory, EffectTrigger } = require('../../../shared/effect-constants');
const { PresetEffectListManager } = require("../preset-lists/preset-effect-list-manager");
const logger = require("../../logwrapper");
const { simpleClone } = require("../../utils");
const { SettingsManager } = require("../../common/settings-manager");

const effectGroup = {
    definition: {
        id: "firebot:run-effect-list",
        name: "Run Effect List",
        description:
            "Run a preset or custom list of effects",
        icon: "fad fa-list",
        categories: ["advanced", "scripting", "trigger control"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="List Type">
            <dropdown-select options="{ custom: 'Custom Effect List', preset: 'Preset Effect List'}" selected="effect.listType"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.listType === 'preset'" header="Preset Effect List" pad-top="true">
            <firebot-searchable-select
                ng-model="effect.presetListId"
                placeholder="Select or search for a preset effect list..."
                items="presetEffectLists"
                on-select="selectPresetList(item)"
            />

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
                    <textarea type="text" class="form-control" placeholder="Enter data" ng-model="effect.presetListArgs[arg.name]" replace-variables rows="1"></textarea>
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

        <eos-container header="Options" pad-top="true">
            <firebot-checkbox
                model="effect.dontWait"
                label="Don't wait for effects to finish"
                tooltip="Check this if you want the root effect list that triggers this list to continue its effect execution instead of waiting for these effects to complete."
            />

            <firebot-checkbox
                ng-if="!effect.dontWait"
                style="margin-top: 10px"
                model="effect.bubbleOutputs"
                label="Apply effect outputs to parent list"
                tooltip="Whether or not you want any effect outputs to be made available to the parent effect list."
            />
        </eos-container>

    `,
    optionsController: ($scope, presetEffectListsService) => {

        $scope.selectedPresetList = null;

        $scope.presetEffectLists = presetEffectListsService.getPresetEffectLists();

        const updatePresetListArgs = (presetList) => {
            const effectArgNames = Object.keys($scope.effect.presetListArgs);
            if (effectArgNames.length) {
                effectArgNames.forEach((argName) => {
                    if (!presetList.args.some(arg => arg.name === argName)) {
                        delete $scope.effect.presetListArgs[argName];
                    }
                });
            }
        };

        $scope.selectPresetList = (presetList) => {
            $scope.selectedPresetList = presetList;
            updatePresetListArgs(presetList);
        };

        $scope.editSelectedPresetList = () => {
            if ($scope.selectedPresetList == null) {
                return;
            }
            presetEffectListsService.showAddEditPresetEffectListModal($scope.selectedPresetList)
                .then((presetList) => {
                    if (presetList) {
                        $scope.selectPresetList(presetList);
                    }
                });
        };

        $scope.getSelectedPresetListName = () => {
            return $scope.selectedPresetList ? $scope.selectedPresetList.name : "";
        };

        $scope.effectListUpdated = function (effects) {
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
                $scope.selectPresetList(presetList);
            }
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.listType === 'preset' && effect.presetListId == null) {
            errors.push("Please select a preset list");
        }
        return errors;
    },
    getDefaultLabel: (effect, presetEffectListsService) => {
        if (effect.listType === 'preset') {
            const presetList = presetEffectListsService.getPresetEffectList(effect.presetListId);
            return effect.presetListId ? presetList?.name : "Unknown Preset Effect List";
        }
        const length = effect.effectList?.list?.length ?? 0;
        return `${length} Custom Effect${length === 1 ? "" : "s"}`;
    },
    onTriggerEvent: (event) => {
        return new Promise((resolve) => {

            const { effect, trigger, outputs } = event;

            let processEffectsRequest = {};

            if (effect.listType === "preset") {
                const presetList = PresetEffectListManager.getItem(effect.presetListId);
                if (presetList == null) {
                    // preset list doesnt exist anymore
                    return resolve(true);
                }

                // The original trigger may be in use down the chain of events,
                // we must therefore deepclone it in order to prevent mutations
                const newTrigger = simpleClone(trigger);

                newTrigger.type = EffectTrigger.PRESET_LIST;
                newTrigger.metadata.presetListArgs = effect.presetListArgs;

                // Prevent hangs if a preset list directly or indirectly calls
                // itself. Some recursion is allowed, but we cap it at 100 calls.
                if (newTrigger.metadata.stackDepth == null) {
                    newTrigger.metadata.stackDepth = {};
                }
                if (newTrigger.metadata.stackDepth[presetList.id] == null) {
                    newTrigger.metadata.stackDepth[presetList.id] = 0;
                }
                newTrigger.metadata.stackDepth[presetList.id] += 1;

                const recursionLimitEnabled = SettingsManager.getSetting("PresetRecursionLimit");
                if (recursionLimitEnabled && newTrigger.metadata.stackDepth[presetList.id] > 100) {
                    logger.error(`Preset Effect List '${presetList.name}' (ID: ${presetList.id}) has been triggered more than 100 times in the same chain. Stopping execution to prevent infinite loop.`);
                    return resolve(true);
                }

                processEffectsRequest = {
                    trigger: newTrigger,
                    effects: presetList.effects,
                    outputs: outputs
                };
            } else {
                const effectList = effect.effectList;

                if (!effectList || !effectList.list) {
                    return resolve(true);
                }

                processEffectsRequest = {
                    trigger: trigger,
                    effects: effectList,
                    outputs: outputs
                };
            }

            const effectExecutionPromise = effectRunner.processEffects(processEffectsRequest);

            if (effect.dontWait) {
                resolve(true);
            } else {
                effectExecutionPromise.then((result) => {
                    if (result != null && result.success === true) {

                        if (result.stopEffectExecution) {
                            return resolve({
                                success: true,
                                outputs: effect.bubbleOutputs ? result.outputs : undefined,
                                execution: {
                                    stop: true,
                                    bubbleStop: true
                                }
                            });
                        }
                    }
                    resolve({
                        success: true,
                        outputs: effect.bubbleOutputs ? result?.outputs : undefined
                    });
                });
            }
        });
    }
};

module.exports = effectGroup;

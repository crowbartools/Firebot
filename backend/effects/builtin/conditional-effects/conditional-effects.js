"use strict";


const { ControlKind, InputEvent } = require('../../../interactive/constants/MixplayConstants');
const effectModels = require("../../models/effectModels");
const { EffectTrigger } = effectModels;

const effectRunner = require("../../../common/effect-runner");
const conditionManager = require("./conditions/condition-manager");
const builtinConditionTypeLoader = require("./conditions/builtin-condition-loader");
builtinConditionTypeLoader.registerConditionTypes();

/**
 * The custom var effect
 */
const model = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:conditional-effects",
        name: "Conditional Effects",
        description: "Conditionally run effects",
        tags: ["Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>
            <div ng-repeat="ifCondition in effect.ifs" style="margin-bottom: 15px;">
                <condition-list header="{{$index === 0 ? 'If' : 'Else If'}}" condition-data="ifCondition.conditionData" trigger="trigger" trigger-meta="triggerMeta"></condition-list>
                <div style="padding-left: 15px;">
                    <div style="font-size: 13px;font-family: 'Quicksand'; color: #8A8B8D;margin-bottom:3px;">Then run the following effects:</div>
                    <effect-list effects="ifCondition.effectData" 
                        trigger="{{trigger}}" 
                        update="effectListUpdated(effects, $index)"
                        header="Effects"
                        modalId="{{modalId}}"></effect-list>  
                </div>
                
            </div>
            <button class="btn btn-default" ng-click="addIf()">Add '{{effect.ifs.length === 0 ? 'If' : 'Else If'}}'</button>
            <div style="margin-top: 15px;">
                <h3 style="margin-bottom: 5px;text-transform: uppercase;font-weight: bold;">OTHERWISE</h3>
                <div style="padding-left: 15px;">
                    <div style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand'; color: #8A8B8D;">
                        <span>if none of the above conditions pass, run the following effects:</span>
                    </div>
                    <effect-list effects="effect.otherwiseEffectData" 
                        trigger="{{trigger}}" 
                        update="otherwiseEffectListUpdated(effects)"
                        header="Effects"
                        modalId="{{modalId}}"></effect-list> 
                </div>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, backendCommunicator) => {

        if ($scope.effect.ifs == null) {
            $scope.effect.ifs = [{
                conditionData: null,
                effectData: null
            }];
        }

        $scope.addIf = () => {
            $scope.effect.ifs.push({
                conditionData: null,
                effectData: null
            });
        };

        $scope.effectListUpdated = (effects, index) => {
            let ifCondition = $scope.effect.ifs[index];
            if (ifCondition) {
                ifCondition.effectData = effects;
            }
        };

        $scope.otherwiseEffectListUpdated = (effects) => {
            $scope.effect.otherwiseEffectData = effects;
        };
    },
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            // What should this do when triggered.
            let { effect, trigger } = event;

            let effectsToRun = null;
            if (effect.ifs != null) {
                for (let ifCondition of effect.ifs) {
                    if (ifCondition.conditionData == null || ifCondition.effectData == null) continue;

                    let didPass = await conditionManager.runConditions(ifCondition.conditionData, trigger);
                    if (didPass) {
                        effectsToRun = ifCondition.effectData;
                        break;
                    }
                }
            }

            if (effectsToRun == null) {
                effectsToRun = effect.otherwiseEffectData;
            }

            if (effectsToRun != null) {
                let processEffectsRequest = {
                    trigger: event.trigger,
                    effects: effectsToRun
                };

                effectRunner.processEffects(processEffectsRequest).then(() => {
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    }
};

module.exports = model;

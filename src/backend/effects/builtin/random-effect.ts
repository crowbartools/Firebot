import type { EffectList, EffectType } from "../../../types/effects";

import effectRunner from "../../common/effect-runner";

const effect: EffectType<{
    effectList: EffectList;
    weighted: boolean;
    dontRepeat: boolean;
    bubbleOutputs: boolean;
    outputs: unknown;
}> = {
    definition: {
        id: "firebot:randomeffect",
        name: "Run Random Effect",
        description: "Run a random effect from a list of effects",
        icon: "fad fa-random",
        categories: ["advanced", "scripting"]
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will run a random effect from the list below.</p>

            <div style="padding-top: 10px;">
                <firebot-checkbox
                    model="effect.weighted"
                    label="Weighted Chances"
                    tooltip="If checked, the effects chances are determined by their weight value. If unchecked, each effect will have an equal chance of being selected."
                    style="margin-bottom: 0"
                />
            </div>
        </eos-container>

        <eos-container pad-top="true">
            <effect-list effects="effect.effectList"
                trigger="{{trigger}}"
                trigger-meta="triggerMeta"
                update="effectListUpdated(effects)"
                header="Effects"
                modalId="{{modalId}}"
                mode="random"
                weighted="effect.weighted"
                dont-repeat-until-all-used="effect.dontRepeat"
            ></effect-list>
        </eos-container>

        <eos-container header="Options" pad-top="true">
            <firebot-checkbox
                ng-hide="effect.weighted"
                model="effect.dontRepeat"
                label="Don't Repeat"
                tooltip="If checked, each effect in this list will be played once before the list is shuffled again, preventing the same effect from repeating successively."
            />
            <firebot-checkbox
                model="effect.bubbleOutputs"
                label="Apply effect outputs to parent list"
                tooltip="Whether or not you want any effect outputs to be made available to the parent effect list."
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.effectListUpdated = (effects: EffectList) => {
            $scope.effect.effectList = effects;
        };
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        const effectList = effect.effectList;

        const outputs = effect.outputs as Record<string, unknown>;

        if (effectList?.list == null) {
            return true;
        }

        // ensure effect list is random and settings are applied (for backwards compatibility)
        effectList.runMode = "random";
        effectList.weighted = effect.weighted;
        effectList.dontRepeatUntilAllUsed = effect.dontRepeat;

        const result = await effectRunner.processEffects({
            effects: effectList,
            trigger,
            outputs
        });

        if (result != null && result.success === true) {
            if (result.stopEffectExecution) {
                return {
                    success: true,
                    outputs: effect.bubbleOutputs ? result.outputs : undefined,
                    execution: {
                        stop: true,
                        bubbleStop: true
                    }
                };
            }
        }

        return {
            success: true,
            outputs: effect.bubbleOutputs ? result?.outputs : undefined
        };
    }
};

export = effect;
import type { EffectList, EffectType } from "../../../types/effects";
import effectRunner from "../../common/effect-runner";

const effect: EffectType<{
    id: string;
    effectList: EffectList;
    outputs: Record<string, unknown>;
}> = {
    definition: {
        id: "firebot:sequentialeffect",
        name: "Run Sequential Effect",
        description: "Run a single effect sequentially from a list of effects",
        icon: "fad fa-list-ol",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
    optionsTemplate: `
    <eos-container>
        <p>This effect will run a single effect sequentially from the list below. Particularly useful in Timers!</p>
    </eos-container>

    <eos-container pad-top="true">
        <effect-list effects="effect.effectList"
            trigger="{{trigger}}"
            trigger-meta="triggerMeta"
            update="effectListUpdated(effects)"
            header="Effects"
            mode="sequential"
            modalId="{{modalId}}"></effect-list>
    </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.effectList == null) {
            $scope.effect.effectList = {} as EffectList;
        }

        $scope.effectListUpdated = (effects: EffectList) => {
            $scope.effect.effectList = effects;
        };
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        const effectList = effect.effectList;
        const outputs = effect.outputs;

        if (effectList?.list == null) {
            return true;
        }

        // ensure effect list is sequential and settings are applied (for backwards compatibility)
        effectList.runMode = "sequential";

        const result = await effectRunner.processEffects({
            effects: effectList,
            trigger,
            outputs
        });

        if (result?.success === true) {
            if (result.stopEffectExecution) {
                return {
                    success: true,
                    execution: {
                        stop: true,
                        bubbleStop: true
                    }
                };
            }
        }
        return true;
    }
};

export = effect;
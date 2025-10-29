import type { EffectType } from "../../../types/effects";
import { wait } from "../../utils";

const effect: EffectType<{
    delay: number;
}> = {
    definition: {
        id: "firebot:delay",
        name: "Delay",
        description: "Pause between effects",
        icon: "fad fa-stopwatch",
        categories: ["common", "advanced", "scripting"],
        dependencies: [],
        exemptFromTimeouts: true
    },
    optionsTemplate: `
        <eos-container header="Duration">
            <div class="input-group">
                <span class="input-group-addon" id="delay-length-effect-type">Seconds</span>
                <input ng-model="effect.delay" type="text" class="form-control" aria-describedby="delay-length-effect-type" type="text" menu-position="under" replace-variables="number">
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.delay == null || (effect.delay.toString()).length < 1) {
            errors.push("Please input a delay duration.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.delay != null ? `${effect.delay} second${effect.delay > 1 ? "s" : ""}` : undefined;
    },
    onTriggerEvent: async ({ effect }) => {
        await wait(effect.delay * 1000);
        return true;
    }
};

export = effect;
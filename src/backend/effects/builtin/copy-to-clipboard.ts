import { EffectType } from "../../../types/effects";
import frontendCommunicator from "../../common/frontend-communicator";

const effect: EffectType<{
    text: string;
}> = {
    definition: {
        id: "firebot:copy-to-clipboard",
        name: "Copy Text to Clipboard",
        description: "Copy text to the system clipboard",
        icon: "fad fa-copy",
        categories: ["advanced", "scripting"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Text to Copy">
            <textarea ng-model="effect.text" id="clipboard-text" class="form-control" placeholder="Enter text to copy" menu-position="under" replace-variables></textarea>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!(effect.text?.length > 0)) {
            errors.push("Please input some text.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        frontendCommunicator.send("copy-to-clipboard", {
            text: effect.text
        });
    }
};

export = effect;
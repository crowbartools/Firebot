import { EffectType } from "../../../types/effects";
import frontendCommunicator from "../../common/frontend-communicator";

interface TtsVoice {
    id: string;
    name: string;
    description: string;
}

const effect: EffectType<{
    text: string;
    voiceId: string;
    wait?: boolean;
}> = {
    definition: {
        id: "firebot:text-to-speech",
        name: "Text-To-Speech",
        description: "Have Firebot read some text out loud with TTS.",
        icon: "fad fa-microphone-alt",
        categories: ["fun"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Text">
            <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>
        </eos-container>

        <eos-container header="Voice" pad-top="true">
            <firebot-searchable-select
                ng-model="effect.voiceId"
                items="ttsVoices"
                placeholder="Select or search for a voice…"
            />
        </eos-container>

        <eos-container header="Wait" pad-top="true">
            <firebot-checkbox
                label="Wait for speech to finish"
                tooltip="Wait for the speech to finish or be cancelled before allowing the next effect to run."
                model="effect.wait"
                style="margin: 0px 15px 0px 0px"
            />
        </eos-container>

        <eos-container header="Volume" pad-top="true">
            <div class="muted">
                <p style="margin-bottom: 5px;">Text-To-Speech volume can only be adjusted globally.</p>
                <p>Go to <span class="font-bold">Settings -> TTS</span> to change the volume.</p>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, ttsService) => {
        if ($scope.effect.voiceId == null) {
            $scope.effect.voiceId = "default";
        }
        if ($scope.effect.wait !== true) {
            $scope.effect.wait = false;
        }

        $scope.ttsVoices = [
            {
                id: "default",
                name: "Default",
                description: "The default voice set in Settings > TTS"
            },
            ...ttsService.getVoices() as TtsVoice[]
        ] as TtsVoice[];


        $scope.getSelectedVoiceName = () => {
            const voiceId = $scope.effect.voiceId;
            if (voiceId === "default" || voiceId == null) {
                return "Default";
            }

            const voice = ttsService.getVoiceById(voiceId) as TtsVoice;

            return voice?.name ?? "Unknown Voice";
        };
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (effect.text == null || effect.text.length < 1) {
            errors.push("Please input some text.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        await frontendCommunicator.fireEventAsync("read-tts", effect);
        return true;
    }
};

export = effect;
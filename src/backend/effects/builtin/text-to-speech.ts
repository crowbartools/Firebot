import frontendCommunicator from "../../../backend/common/frontend-communicator";
import { EffectCategory } from "../../../shared/effect-constants";
import { EffectType } from "../../../types/effects";

const effect: EffectType<{
    text: string;
    voiceId: "default" | string;
    wait?: boolean;
}> = {
    definition: {
        id: "firebot:text-to-speech",
        name: "Text-To-Speech",
        description: "Have Firebot read out some text.",
        icon: "fad fa-microphone-alt",
        categories: [EffectCategory.FUN],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Text">
            <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>
        </eos-container>

        <eos-container header="Voice" pad-top="true">
            <div class="dropdown">
                <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                    <span class="dropdown-text">{{getSelectedVoiceName()}}</span>
                    <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li><a href ng-click="effect.voiceId = 'default'">Default <tooltip text="'The default voice set in Settings > TTS'"></tooltip></a></li>
                    <li ng-repeat="voice in ttsVoices"><a href ng-click="effect.voiceId = voice.id">{{voice.name}}</a></li>
                </ul>
            </div>
        </eos-container>

        <eos-container header="Wait" pad-top="true">
            <firebot-checkbox
                label="Wait for speech to finish"
                tooltip="Wait for the speech to finish or be cancelled before allowing the next effect to run."
                model="effect.wait"
                style="margin: 0px 15px 0px 0px"
            />
        </eos-container>
    `,
    optionsController: ($scope, ttsService) => {
        if ($scope.effect.voiceId == null) {
            $scope.effect.voiceId = "default";
        }
        if ($scope.effect.wait !== true) {
            $scope.effect.wait = false;
        }

        $scope.ttsVoices = ttsService.getVoices();

        $scope.getSelectedVoiceName = () => {
            const voiceId = $scope.effect.voiceId;
            if (voiceId === "default" || voiceId == null) {
                return "Default";
            }

            const voice = ttsService.getVoiceById(voiceId);

            return voice?.name ?? "Unknown Voice";
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.text == null || effect.text.length < 1) {
            errors.push("Please input some text.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        const effect = event.effect;

        await frontendCommunicator.fireEventAsync("read-tts", effect);

        return true;
    }
};

export = effect;

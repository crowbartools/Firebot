import { EffectType } from "../../../../../types/effects";
import { saveReplayBuffer } from "../obs-remote";

export const SaveReplayBufferEffectType: EffectType = {
    definition: {
        id: "firebot:obs-save-replay-buffer",
        name: "Save OBS Replay Buffer",
        description: "Tell OBS to save the replay buffer",
        icon: "fad fa-redo-alt",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container>
      <div class="effect-info alert alert-warning">
        <b>Warning!</b> This will only work if the replay buffer is enabled and active in OBS.
      </div>
    </eos-container>
  `,
    optionsController: () => {},
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async () => {
        saveReplayBuffer();
        return true;
    }
};

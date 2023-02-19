import { EffectType } from "../../../../../types/effects";
import { stopStreaming } from "../obs-remote";

export const StopStreamEffectType: EffectType<{}> = {
  definition: {
    id: "ebiggz:obs-stop-stream",
    name: "OBS Stop Stream",
    description: "Tell OBS to stop streaming",
    icon: "fad fa-stop-circle",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container>
      <div class="effect-info alert alert-warning">
        <b>Warning!</b> When this effect is activated, Firebot will tell OBS to stop streaming.
      </div>
    </eos-container>
  `,
  optionsController: () => {},
  optionsValidator: () => {
    return [];
  },
  onTriggerEvent: async () => {
    stopStreaming();
    return true;
  },
};

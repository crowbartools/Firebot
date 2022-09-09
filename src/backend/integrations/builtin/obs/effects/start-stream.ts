import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { startStreaming } from "../obs-remote";

export const StartStreamEffectType: Firebot.EffectType<{}> = {
  definition: {
    id: "ebiggz:obs-start-stream",
    name: "OBS Start Stream",
    description: "Tell OBS to start streaming",
    icon: "fad fa-play-circle",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container>
      <div class="effect-info alert alert-warning">
        <b>Warning!</b> When this effect is activated, Firebot will tell OBS to start streaming.
      </div>
    </eos-container>
  `,
  optionsController: () => {},
  optionsValidator: () => {
    return [];
  },
  onTriggerEvent: async () => {
    startStreaming();
    return true;
  },
};

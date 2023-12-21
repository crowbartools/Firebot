import { EffectType } from "../../../../../types/effects";
import { stopVirtualCam } from "../obs-remote";

export const StopVirtualCamEffectType: EffectType = {
    definition: {
        id: "ebiggz:obs-stop-virtual-cam",
        name: "OBS Stop Virtual Camera",
        description: "Tell OBS to stop the virtual camera",
        icon: "fad fa-camera-home",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container>
      <div class="effect-info alert alert-warning">
        <b>Warning!</b> When this effect is activated, Firebot will tell OBS to stop the virtual camera.
      </div>
    </eos-container>
  `,
    optionsController: () => {},
    optionsValidator: () => {
        return [];
    },
    onTriggerEvent: async () => {
        stopVirtualCam();
        return true;
    }
};

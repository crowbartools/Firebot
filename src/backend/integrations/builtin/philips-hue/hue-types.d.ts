export type HueControlLightEffectData = {
    lightId: string;
    updateActivated: boolean;
    activationAction?: "off" | "on" | "toggle";
    updateBrightness: boolean;
    brightnessPercentage?: string;
    updateColor: boolean;
    /**
     * Hex color string
     */
    color?: string;
    triggerEffectAnimation: boolean;
    effectAnimationType?: "colorloop" | "none";
    triggerAlert: boolean;
    alertType?: "short" | "long" | "disable";
    transitionType?: "default" | "instant" | "fast" | "slow" | "custom";
    customTransitionSecs?: string;
};

export type HueLightData = {
    id: string;
    name: string;
    type: string;
    capabilities: {
        control?: {
            mindimlevel?: undefined;
            colorgamuttype?: "C";
            colorgamut?: [number, number][];
        };
    };
};

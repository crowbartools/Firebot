import type { OverlayWidgetConfig } from "../../../../types/overlay-widgets";
import type { FontOptions } from "../../../../types/parameters";

export type Settings = {
    counterId: string;
    counterFontOptions?: FontOptions;
    showCounterName?: boolean;
    nameFontOptions?: FontOptions;
    textAlignment: "left" | "center" | "right";
};

export type State = {
    counterName?: string;
    counterValue?: number;
};

export type CounterDisplayWidgetConfig = OverlayWidgetConfig<Settings, State>;
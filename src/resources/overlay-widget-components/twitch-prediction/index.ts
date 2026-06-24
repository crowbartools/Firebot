import { createApp, reactive, type App } from "vue";
import PredictionWidget from "./PredictionWidget.vue";
import type { Animation, OverlayWidgetComponent } from "../../../types/overlay-widgets.js";
import type { PredictionSettings, PredictionState } from "../../../backend/overlay-widgets/builtin-types/twitch-prediction/twitch-prediction.js";

type Store = {
    settings: PredictionSettings;
    state: PredictionState;
    entryAnimation: Animation | null;
    exitAnimation: Animation | null;
};

const component: OverlayWidgetComponent<PredictionSettings, PredictionState> = {
    mount({ container, config }) {
        const store = reactive<Store>({
            settings: config.settings,
            state: (config.state as PredictionState) ?? { prediction: null },
            entryAnimation: config.entryAnimation ?? null,
            exitAnimation: config.exitAnimation ?? null
        });

        const app: App = createApp(PredictionWidget, { store });
        app.mount(container);

        return {
            update(newConfig) {
                store.settings = newConfig.settings;
                store.state = (newConfig.state as PredictionState) ?? { prediction: null };
                store.entryAnimation = newConfig.entryAnimation ?? null;
                store.exitAnimation = newConfig.exitAnimation ?? null;
            },
            destroy() {
                app.unmount();
            }
        };
    }
};

export default component;

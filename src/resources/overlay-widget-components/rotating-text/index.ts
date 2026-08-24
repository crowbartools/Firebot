import { createApp, reactive, type App } from "vue";
import RotatingTextWidget from "./RotatingTextWidget.vue";
import type { Animation, IOverlayWidgetEventUtils, OverlayWidgetComponent } from "../../../types/overlay-widgets.js";
import type { RotatingTextSettings, RotatingTextState } from "../../../backend/overlay-widgets/builtin-types/rotating-text/rotating-text.js";

type Store = {
    settings: RotatingTextSettings;
    entryAnimation: Animation | null;
    exitAnimation: Animation | null;
    visible: boolean;
};

const component: OverlayWidgetComponent<RotatingTextSettings, RotatingTextState> = {
    mount({ container, config, utils }) {
        const store = reactive<Store>({
            settings: config.settings,
            entryAnimation: config.entryAnimation ?? null,
            exitAnimation: config.exitAnimation ?? null,
            visible: true,
        });

        const app: App = createApp(RotatingTextWidget, { store, utils });
        app.mount(container);

        return {
            update(newConfig) {
                store.settings = newConfig.settings;
                store.entryAnimation = newConfig.entryAnimation ?? null;
                store.exitAnimation = newConfig.exitAnimation ?? null;
            },
            destroy() {
                store.visible = false;
                const exitDuration = store.exitAnimation?.class && store.exitAnimation.class !== "none"
                    ? (store.exitAnimation.duration ?? 1) * 1000 + 200
                    : 0;
                setTimeout(() => app.unmount(), exitDuration);
            }
        };
    }
};

export default component;

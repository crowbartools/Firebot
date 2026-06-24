import { createApp, reactive, type App } from "vue";
import PollWidget from "./PollWidget.vue";
import type { Animation, OverlayWidgetComponent } from "../../../types/overlay-widgets.js";
import type { PollSettings, PollState } from "../../../backend/overlay-widgets/builtin-types/twitch-poll/twitch-poll.js";

type Store = {
    settings: PollSettings;
    state: PollState;
    entryAnimation: Animation | null;
    exitAnimation: Animation | null;
};

const component: OverlayWidgetComponent<PollSettings, PollState> = {
    mount({ container, config }) {
        const store = reactive<Store>({
            settings: config.settings,
            state: (config.state as PollState) ?? { poll: null },
            entryAnimation: config.entryAnimation ?? null,
            exitAnimation: config.exitAnimation ?? null
        });

        const app: App = createApp(PollWidget, { store });
        app.mount(container);

        return {
            update(newConfig) {
                store.settings = newConfig.settings;
                store.state = (newConfig.state as PollState) ?? { poll: null };
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

import { createApp } from "vue";

import App from "./App.vue";
import DeckControl from "./components/DeckControl.vue";
import DeckPicker from "./components/DeckPicker.vue";
import PinPrompt from "./components/PinPrompt.vue";
import InputPrompt from "./components/InputPrompt.vue";
import LucideIcon from "./components/LucideIcon.vue";
import ControlIcon from "./components/ControlIcon.vue";
import ControlLabel from "./components/ControlLabel.vue";

import "./assets/main.css";

createApp(App)
    .component("DeckControl", DeckControl)
    .component("DeckPicker", DeckPicker)
    .component("PinPrompt", PinPrompt)
    .component("InputPrompt", InputPrompt)
    .component("ControlIcon", ControlIcon)
    .component("ControlLabel", ControlLabel)
    .component("LucideIcon", LucideIcon)
    .mount("#app");

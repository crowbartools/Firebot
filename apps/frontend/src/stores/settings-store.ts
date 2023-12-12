import { makeAutoObservable } from "mobx";

export type FirebotTheme = "shadow" | "slate" | "snow";

class SettingsStore {

    theme: FirebotTheme = "shadow";

    constructor() {
        makeAutoObservable(
            this,
            {},
            {
                autoBind: true
            }
        );
    }

    setTheme(theme: FirebotTheme) {
        this.theme = theme;
        if(document) {
            const root = document.getElementById("root");
            if(root) {
                root.className = theme;
            }
        }
    }
}

export const settingsStore = new SettingsStore();